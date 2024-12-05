import firebase from 'firebase/app';
import 'firebase/firestore';
import NotificationDto from './NotificationDto';

export class NotificationDao {
  private _COLLECTION_REF = 'notifications';
  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  public async getAllAlerts(userId: string): Promise<NotificationDto[]> {
    const query = this.db.collection(this._COLLECTION_REF);
    const querySnapshot = await query.get();
    const queryResults = querySnapshot.docs;
    return NotificationDao._createFromQuery(queryResults);
  }

  public createAlert(notification: NotificationDto) {
    const query = this.db.collection(this._COLLECTION_REF);
    notification.creationTime = firebase.firestore.Timestamp.now().seconds;
    query.add({ ...notification }).catch((e) => {
      console.error(e);
    });
  }

  public setAlert(notification: NotificationDto) {
    const dto = Object.assign(NotificationDto.defaultsConstructor(), notification);

    const docRef = this.db.collection(this._COLLECTION_REF).doc(dto.id || '');
    docRef.update({ ...dto }).catch((e) => {
      console.error(e);
    });
  }

  public deleteAlert(notification: NotificationDto) {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(notification.id || '');
    docRef.delete().catch((e) => {
      console.error(e);
    });
  }

  public watchForChanges(onlyActive: boolean, callback: (resultList: NotificationDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = onlyActive ? this.db.collection(this._COLLECTION_REF).where('enabled', '==', true) : this.db.collection(this._COLLECTION_REF);

    query
      .onSnapshot(
        (docs) => {
          const resultList = NotificationDao._createFromQuery(docs.docs);
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

  public static _createFromQuery(docs: firebase.firestore.QueryDocumentSnapshot[]): NotificationDto[] {
    const result: NotificationDto[] = [];
    if (docs !== undefined && docs != null) {
      docs.forEach((element) => {
        if (element.exists) {
          const dto = element.data() as NotificationDto;
          dto.id = element.id;
          result.push(dto);
        }
      });
    }
    return result;
  }
}
