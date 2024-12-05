import firebase from 'firebase/app';
import 'firebase/firestore';
import TaxonomyUserDto from './TaxonomyUserDto';
import { ClientUser } from '../UserManagement';

export class TaxonomyUserDao {
  private _COLLECTION_REF = 'taxonomyUser';
  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  public async getAll(): Promise<TaxonomyUserDto[]> {
    const query = this.db.collection(this._COLLECTION_REF);
    const querySnapshot = await query.get();
    const queryResults = querySnapshot.docs;
    return TaxonomyUserDao._createFromQuery(queryResults);
  }

  public create(item: TaxonomyUserDto, id: string) {
    const query = this.db.collection(this._COLLECTION_REF).doc(id);
    query.set({ ...item }).catch((e) => {
      console.error(e);
    });
  }

  public async get(id: string): Promise<TaxonomyUserDto | undefined> {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(id);
    const querySnapshot = await docRef.get();
    const doc = querySnapshot.data() as TaxonomyUserDto;
    return doc;
  }

  public set(item: TaxonomyUserDto, docId: string) {
    const dto = Object.assign(TaxonomyUserDto.defaultsConstructor(), item);

    const docRef = this.db.collection(this._COLLECTION_REF).doc(docId || '');
    docRef.update({ ...dto }).catch((e) => {
      console.error(e);
    });
  }

  public async updateSuperAdmin(accessEntry: ClientUser) {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(accessEntry.id);
    const userSnapshot = await docRef.get();
    const userDoc = userSnapshot.data() as TaxonomyUserDto;
    userDoc.superAdmin = accessEntry.isSuperAdmin;
    docRef.update({ ...userDoc }).catch((e) => {
      console.error(e);
    });
  }

  public watchSuperAdmins(callback: (resultList: { [key: string]: TaxonomyUserDto }) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).where('superAdmin', '==', true);
    query
      .onSnapshot(
        (docs) => {
          const userDocs: { [key: string]: TaxonomyUserDto } = {};
          docs.docs.forEach((userDoc) => {
            if (userDoc.exists) {
              userDocs[userDoc.id] = userDoc.data() as TaxonomyUserDto;
            }
          });
          callback(userDocs);
        },
        (err) => {
          if (errorCallback !== undefined) {
            errorCallback(err);
          }
        },
      )
      .bind(this);
  }

  public watchForChanges(callback: (resultList: TaxonomyUserDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF);

    query
      .onSnapshot(
        (docs) => {
          const resultList = TaxonomyUserDao._createFromQuery(docs.docs);
          callback(resultList);
        },
        (err) => {
          if (errorCallback !== undefined) {
            errorCallback(err);
          }
        },
      )
      .bind(this);
  }

  public static _createFromQuery(docs: firebase.firestore.QueryDocumentSnapshot[]): TaxonomyUserDto[] {
    const result: TaxonomyUserDto[] = [];
    if (docs !== undefined && docs != null) {
      docs.forEach((element) => {
        if (element.exists) {
          const dto = element.data() as TaxonomyUserDto;
          result.push(dto);
        }
      });
    }
    return result;
  }
}
