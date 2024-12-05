import firebase from 'firebase/app';
import 'firebase/firestore';
import TaxonomyGroupClaimsDto from './TaxonomyGroupClaimsDto';

export class TaxonomyGroupClaimsDao {
  private _COLLECTION_REF = 'taxonomyGroupClaims';
  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  public async getAll(): Promise<TaxonomyGroupClaimsDto[]> {
    const query = this.db.collection(this._COLLECTION_REF);
    const querySnapshot = await query.get();
    const queryResults = querySnapshot.docs;
    return TaxonomyGroupClaimsDao._createFromQuery(queryResults);
  }

  public create(item: TaxonomyGroupClaimsDto) {
    const query = this.db.collection(this._COLLECTION_REF);
    item.creationTime = firebase.firestore.Timestamp.now().seconds;
    query.add({ ...item }).catch((e) => {
      console.error(e);
    });
  }

  public async get(id: string): Promise<TaxonomyGroupClaimsDto | undefined> {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(id);
    const querySnapshot = await docRef.get();
    const doc = querySnapshot.data() as TaxonomyGroupClaimsDto;
    doc.id = querySnapshot.id;
    return doc;
  }

  public set(item: TaxonomyGroupClaimsDto, onSuccess?: () => any) {
    const dto = Object.assign(TaxonomyGroupClaimsDto.defaultsConstructor(), item);

    const docRef = this.db.collection(this._COLLECTION_REF).doc(dto.id || '');
    docRef
      .update({ ...dto })
      .then(() => {
        if (onSuccess) {
          onSuccess();
        }
      })
      .catch((e) => {
        console.error(e);
      });
  }

  public delete(item: TaxonomyGroupClaimsDto) {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(item.id || '');
    docRef.delete().catch((e) => {
      console.error(e);
    });
  }

  public watchForChanges(callback: (resultList: TaxonomyGroupClaimsDto[]) => void, watchid?: string, errorCallback?: (error: Error) => void) {
    const query = watchid ? this.db.collection(this._COLLECTION_REF).where(firebase.firestore.FieldPath.documentId(), '==', watchid) : this.db.collection(this._COLLECTION_REF);
    query
      .onSnapshot(
        (docs) => {
          const resultList = TaxonomyGroupClaimsDao._createFromQuery(docs.docs);
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

  public watchDocumentForChanges(callback: (resultList?: TaxonomyGroupClaimsDto) => void, docId: string, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).doc(docId);
    query
      .onSnapshot(
        (doc) => {
          const resultList = doc.data() as TaxonomyGroupClaimsDto | undefined;
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

  public static _createFromQuery(docs: firebase.firestore.QueryDocumentSnapshot[]): TaxonomyGroupClaimsDto[] {
    const result: TaxonomyGroupClaimsDto[] = [];
    if (docs !== undefined && docs != null) {
      docs.forEach((element) => {
        if (element.exists) {
          const dto = element.data() as TaxonomyGroupClaimsDto;
          dto.id = element.id;
          result.push(dto);
        }
      });
    }
    return result;
  }
}
