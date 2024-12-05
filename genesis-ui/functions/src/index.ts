import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();

/**
 * Used to create user metadata for use with taxonomy user creation. This way
 * the front end can query from a list of users to add to clients in user managment.
 */
export const addNewUsers = functions.auth.user().onCreate((user) => {
  const db = admin.firestore();
  functions.logger.log('set');
  db.collection('UserList').doc(user.uid).set({
    email: user.email,
    userName: user.displayName,
  });
});


/**
 * Used when a super admin creates a user, create that user in firebase
 */
 export const createNewAccount = functions.runWith({minInstances: 1}).firestore.document('UserList/{userId}').onCreate((snapshot, context) => {
  functions.logger.log('set');
  const userData: {email: string, userName: string}  = snapshot.data() as any;
  admin
  .auth().createUser({
    uid: snapshot.id,
    email: userData.email,
    displayName: userData.userName,
    disabled: false,
  }).catch((error) => {
    functions.logger.log('Error creating user', error);
  });
});

export const deleteAllClientDocuments = functions.firestore.document('taxonomyGroupClaims/{groupId}').onDelete((snapshot, context) => {
  const TAXONOMY_TEMPLATE_COLLECTION = 'taxonomyTemplate';
  const TAXONOMY_GLOSSARY_COLLECTION = 'taxonomyGlossary';
  const TAXONOMY_USER_COLLECTION = 'taxonomyUser';
  const db = admin.firestore();

  const clientData = snapshot.data();
  if (clientData === undefined) {
    return;
  }
  const clientId = snapshot.id;
  functions.logger.log('Querying firestore for glossaries associated with deleted client');
  db.collection(TAXONOMY_GLOSSARY_COLLECTION)
    .where('claim.groupId', '==', clientId)
    .get()
    .then((glossarySnapshot) => {
      const glossaryDocs = glossarySnapshot.docs;
      glossaryDocs.forEach((glossaryDoc) => {
        functions.logger.log(`Deleting glossary ${glossaryDoc.data().name}`);
        db.collection(TAXONOMY_GLOSSARY_COLLECTION).doc(glossaryDoc.id).delete();
      });
    })
    .catch((error) => {
      functions.logger.error('Error deleting glossary', error);
    });

  functions.logger.log('Querying firestore for templates associated with deleted client');
  db.collection(TAXONOMY_TEMPLATE_COLLECTION)
    .where('claim.groupId', '==', clientId)
    .get()
    .then((templateSnapshot) => {
      const templateDocs = templateSnapshot.docs;
      templateDocs.forEach((templateDoc) => {
        functions.logger.log(`Deleting template ${templateDoc.data().templateName}`);
        db.collection(TAXONOMY_TEMPLATE_COLLECTION).doc(templateDoc.id).delete();
      });
    })
    .catch((error) => {
      functions.logger.error('Error deleting template', error);
    });
  functions.logger.log('Querying user documents to remove deleted clients from User docs');
  db.collection(TAXONOMY_USER_COLLECTION)
    .get()
    .then((userSnapshots) => {
      userSnapshots.forEach((userSnapshot) => {
        const userData = userSnapshot.data();
        const userClients = userData.clients;
        if (Object.keys(userClients).includes(clientId)) {
          delete userClients[clientId];
          userData.clients = userClients;
          db.collection(TAXONOMY_USER_COLLECTION).doc(userSnapshot.id).set(userData);
        }
      });
    });
});

/**
 * Whenever a user is added or remove to a client update metadata for that user for the cient and all documents that belong to that client
 * assumes the taxonomyGroupClaims objects always exist when adding a user. Sets admin for users if they are ever added as an admin,
 * never removes it unless they lose access to everything
 *
 */
export const updateUserMetaData = functions.runWith({minInstances: 1}).firestore.document('taxonomyGroupClaims/{groupId}').onWrite((change, context) => {
  const TAXONOMYUSER_COLLECTION = 'taxonomyUser';
  const db = admin.firestore();

  const newData = change.after.data();
  const oldData = change.before.data();
  if (newData === undefined) {
    return;
  }
  if (oldData === undefined) {
    return;
  }
  const usersToGrantAccess = Object.keys(newData.users).filter((user) => {
    return oldData.users[user] === undefined;
  });
  const usersToGrantAdmin = Object.keys(newData.admins).filter((user) => {
    return oldData.admins[user] === undefined;
  });
  const usersToModifyAdmin = Object.keys(oldData.admins).filter((user) => {
    return newData.admins[user] === undefined;
  });
  const usersToRemoveAccess = Object.keys(oldData.users).filter((user) => {
    return newData.users[user] === undefined;
  });

  usersToGrantAccess.push(...usersToGrantAdmin);
  usersToGrantAccess.push(...usersToModifyAdmin);

  const usersToGrantAdminSet = new Set(usersToGrantAdmin);
  // Add metadata and grant access to genesisTaxonomy
  usersToGrantAccess.forEach((userId) => {
    const userIsAdmin = usersToGrantAdminSet.has(userId);
    admin
      .auth()
      .getUser(userId)
      .then((userData) => {
        let claims = userData.customClaims;
        if (claims === undefined) {
          claims = {};
        }
        if (claims['genesisTaxonomy'] === true) {
          return;
        }
        claims['genesisTaxonomy'] = true;
        admin.auth().setCustomUserClaims(userId, claims);
        return;
      })
      .catch((error) => {
        functions.logger.log('Error adding user claims for taxonomy:', error);
      });
    db.collection(TAXONOMYUSER_COLLECTION)
      .doc(userId)
      .get()
      .then((doc) => {
        const userName = newData.users[userId]['userName'] || '';
        const userData = doc.data();
        if (doc.exists && userData !== undefined) {
          userData.clients[change.after.id] = { name: newData.clientName, isAdmin: userIsAdmin };
          userData.admin = userIsAdmin;
          userData.userName = userName;
          db.collection(TAXONOMYUSER_COLLECTION).doc(userId).set(userData);
        } else {
          const newUserData: { clients: { [key: string]: { name: string; isAdmin: boolean } }; superAdmin: boolean; admin: boolean; userName: string } = {
            clients: {},
            superAdmin: false,
            admin: userIsAdmin,
            userName,
          };
          newUserData.clients[change.after.id] = { name: newData.clientName, isAdmin: userIsAdmin };
          db.collection(TAXONOMYUSER_COLLECTION).doc(userId).set(newUserData);
        }
        return;
      })
      .catch((error) => {
        functions.logger.log('Error adding user metadata:', error);
      });
  });
  // Remove metadata
  usersToRemoveAccess.forEach((userId) => {
    db.collection(TAXONOMYUSER_COLLECTION)
      .doc(userId)
      .get()
      .then((doc) => {
        const userData = doc.data();

        if (doc.exists && userData !== undefined) {
          delete userData.clients[change.after.id];
          // If the user has no clients then remove any admin metadata
          if (Object.keys(userData.clients).length < 1) {
            userData.admin = false;
          }
          db.collection(TAXONOMYUSER_COLLECTION).doc(userId).set(userData);
        }
        return;
      })
      .catch((error) => {
        functions.logger.log('Error removing user metadata:', error);
      });
  });
});
