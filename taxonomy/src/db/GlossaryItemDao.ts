import { BiMapBuilder } from '@mightyhive/material-components';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { GlossaryCategoryDto, GlossaryItemDto } from './GlossaryItemDto';

export const taxonomyGlossaryLocation = 'taxonomyGlossary';
export const jumpIDGlossaryLocation = 'jumpIDGlossary';

/**
 * Database format object for ease of communicating with DB
 */
class GlossaryDBFormat {
  creationTime: number | null;
  name: string; // Glossary Name
  claim: { ownerId: string | null; groupId: string; claim: string }; // Claim

  constructor(glossary: GlossaryItemDto) {
    this.name = glossary.name;
    if (glossary.claim != null) {
      this.claim = {
        ownerId: glossary.claim.ownerId,
        groupId: glossary.claim.groupId,
        claim: glossary.claim.claim,
      };
    }
  }
}

/**
 * Database format object for ease of communicating with DB
 */
class GlossaryCategoryDBFormat {
  creationTime: number | null;
  name: string; // Category name
  /**
   * Map of key/value pairs for terms
   * going to be an object with keys as variable names.
   *
   * so Map<string, string> will look like: {"Year 2022" => "2022"}, {"Year 2021" => "2021"}
   * object form looks like: {Year 2022: '2022', Year 2021: '2021'}
   */
  terms: { [key: string]: string[] };

  constructor(category: GlossaryCategoryDto) {
    let termsObject = {};
    if (category.terms !== undefined) {
      category.terms.forEach((value: string, key: string) => {
        termsObject[key] = value;
      });
    }
    this.name = category.name;
    this.terms = termsObject;
  }
}

export class GlossaryItemDao {
  private _COLLECTION_REF = taxonomyGlossaryLocation;
  private _CATEGORIES_REF_NAME = 'categories';

  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  /**
   * Sets the firebase location to read and store the documents
   * @param location path to location
   */
    public setLocation(location: string) {
    this._COLLECTION_REF = location;
  }

  /**
   * Creates glossaries from the query result
   * @param glossaryDocs
   * @returns
   */
  public static _createGlossariesFromQuery(glossaryDocs: firebase.firestore.QueryDocumentSnapshot[]): GlossaryItemDto[] {
    const result: GlossaryItemDto[] = [];
    if (glossaryDocs !== undefined && glossaryDocs != null) {
      glossaryDocs.forEach((element) => {
        if (element.exists) {
          let glossaryDto = Object.assign(new GlossaryItemDto(), element.data());
          glossaryDto.id = element.id;
          result.push(glossaryDto);
        }
      });
    }
    return result;
  }

  /**
   * Creates categories from the query result
   * @param categoryQueryResults
   * @returns
   */
  public static _createCategoriesForGlossary(categoryQueryResults: firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData>[]): GlossaryCategoryDto[] {
    const result: GlossaryCategoryDto[] = [];
    if (categoryQueryResults !== undefined && categoryQueryResults != null) {
      categoryQueryResults.forEach((element) => {
        if (element.exists) {
          let categoryDto = Object.assign(new GlossaryCategoryDto(), element.data());
          categoryDto.id = element.id;
          if (categoryDto.terms !== undefined) {
            // Necessary to convert from Object to Map
            const map: Map<string, string> = new Map(Object.entries(categoryDto.terms));
            const terms = new BiMapBuilder<string, string>().empty();
            map.forEach((value, key) => {
              terms.set(key, value);
            });
            categoryDto.terms = terms;
          }
          result.push(categoryDto);
        }
      });
    }
    return result;
  }

  /**
   * Watch for changes in the glossaries
   * @param callback
   * @param errorCallback
   */
  public watchForGlossaryChanges(clientId: string, callback: (resultList: GlossaryItemDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).where('claim.groupId', '==', clientId);
    query
      .onSnapshot(
        (docs) => {
          const resultList = GlossaryItemDao._createGlossariesFromQuery(docs.docs);
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

  /**
   * Watch for changes in the categories under the specific glossary
   * @param glossary
   * @param callback
   * @param errorCallback
   */
  public watchForCategoryChanges(glossary: GlossaryItemDto, callback: (resultList: GlossaryCategoryDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).doc(glossary.id).collection(this._CATEGORIES_REF_NAME);

    query
      .onSnapshot(
        (docs) => {
          const resultList = GlossaryItemDao._createCategoriesForGlossary(docs.docs);
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

  /**
   * Creates glossary in db
   * @param glossary
   */
  public async createGlossary(glossary: GlossaryItemDto): Promise<string> {
    const glossaryDbObject = new GlossaryDBFormat(glossary);
    glossaryDbObject.creationTime = firebase.firestore.Timestamp.now().seconds;

    const docRef = this.db.collection(this._COLLECTION_REF);
    const idPromise = await docRef
      .add({ ...glossaryDbObject })
      .then((data) => {
        return data.id;
      })
      .catch((e) => {
        console.error(e);
      });
    // This should never be the case, but TS says the result is `string | void`
    if (idPromise == undefined) {
      console.error('Error saving new glossary');
      throw new Error('Undefined return from saving glossary to firebase');
    }
    return idPromise;
  }

  /**
   * Update Glossary in the DB
   * @param glossary
   */
  public updateGlossary(glossary: GlossaryItemDto): void {
    const glossaryDbObject = new GlossaryDBFormat(glossary);

    const docRef = this.db.collection(this._COLLECTION_REF).doc(glossary.id);

    docRef.update({ ...glossaryDbObject }).catch((e) => {
      console.error(e);
    });
  }

  /**
   * Creates category in db
   * @param glossary
   * @param category
   */
  public async createCategory(glossary: GlossaryItemDto, category: GlossaryCategoryDto): Promise<string> {
    const categoryObject = new GlossaryCategoryDBFormat(category);
    categoryObject.creationTime = firebase.firestore.Timestamp.now().seconds;

    const docRef = this.db.collection(this._COLLECTION_REF).doc(glossary.id).collection(this._CATEGORIES_REF_NAME);

    const idPromise = await docRef
      .add({ ...categoryObject })
      .then((doc) => doc.id)
      .catch((e) => {
        console.error(e);
        throw e;
      });
    return idPromise;
  }

  /**
   * Deletes glossary
   * @param glossary
   */
  public deleteGlossary(glossary: GlossaryItemDto): void {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(glossary.id);

    docRef.delete().catch((e) => {
      console.error(e);
    });
  }

  /**
   * Deletes category
   * @param glossary
   * @param category
   */
  public deleteCategory(glossary: GlossaryItemDto, category: GlossaryCategoryDto): void {
    const docRef = this.db
      .collection(this._COLLECTION_REF)
      .doc(glossary.id)
      .collection(this._CATEGORIES_REF_NAME)
      .doc(category.id || '');

    docRef.delete().catch((e) => {
      console.error(e);
    });
  }

  /**
   * Update category in the DB
   * @param glossary
   * @param category
   */
  public updateCategory(glossary: GlossaryItemDto, category: GlossaryCategoryDto): void {
    const categoryDbObject = new GlossaryCategoryDBFormat(category);

    const docRef = this.db
      .collection(this._COLLECTION_REF)
      .doc(glossary.id)
      .collection(this._CATEGORIES_REF_NAME)
      .doc(category.id || '');

    docRef.update({ ...categoryDbObject }).catch((e) => {
      console.error(e);
    });
  }

  public getCategories(glossary: GlossaryItemDto): Promise<GlossaryCategoryDto[]> {
    const query = this.db.collection(this._COLLECTION_REF).doc(glossary.id).collection(this._CATEGORIES_REF_NAME);
    const snapshot = query.get();
    const returnObj = snapshot.then((docCollection) => {
      const existingCategories = GlossaryItemDao._createCategoriesForGlossary(docCollection.docs);
      return existingCategories;
    });
    return returnObj;
  }
}
