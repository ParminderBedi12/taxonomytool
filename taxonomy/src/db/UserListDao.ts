import firebase from 'firebase/app';
import 'firebase/firestore';
import UserListDto from './UserListDto';

export class UserListDao {
  private _COLLECTION_REF = 'UserList';
  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  public async getAll(): Promise<UserListDto[]> {
    const query = this.db.collection(this._COLLECTION_REF);
    const querySnapshot = await query.get();
    const queryResults = querySnapshot.docs;
    return UserListDao._createFromQuery(queryResults);
  }

  public create(item: UserListDto) {
    const query = this.db.collection(this._COLLECTION_REF);
    query.add({ ...item }).catch((e) => {
      console.error(e);
    });
  }

  public set(item: UserListDto) {
    const dto = Object.assign(UserListDto.defaultsConstructor(), item);

    const docRef = this.db.collection(this._COLLECTION_REF).doc(dto.id || '');
    docRef.update({ ...dto }).catch((e) => {
      console.error(e);
    });
  }

  public delete(item: UserListDto) {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(item.id || '');
    docRef.delete().catch((e) => {
      console.error(e);
    });
  }

  public watchForChanges(callback: (resultList: UserListDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF);

    query
      .onSnapshot(
        (docs) => {
          const resultList = UserListDao._createFromQuery(docs.docs);
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

  public static _createFromQuery(docs: firebase.firestore.QueryDocumentSnapshot[]): UserListDto[] {
    const result: UserListDto[] = [];
    if (docs !== undefined && docs != null) {
      docs.forEach((element) => {
        if (element.exists) {
          const dto = element.data() as UserListDto;
          dto.id = element.id;
          result.push(dto);
        }
      });
    }
    return result;
  }
}
