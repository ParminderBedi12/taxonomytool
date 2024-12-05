import { BiMapBuilder } from '@mightyhive/material-components';
import firebase from 'firebase/app';
import 'firebase/firestore';
import { GlossaryCategoryDto } from './GlossaryItemDto';
import TaxonomyTemplateDto from './TaxonomyTemplateDto';

export interface CreationReturnObject {
  success: boolean;
  docId: string;
}

/**
 * Database format object for ease of communicating with DB
 */

class TaxonomyTemplateDBFormat {
  public creationTime: number | null;
  public templateName: string;
  public parent: boolean;
  public parentId: string;
  public business: string;
  public glossaryId: string;
  public glossaryName: string;
  /**
   * Glossary id
   */
  public glossaryJumpIDId: string;
  /**
   * Glossary name metadata
   */
  /**
   * These are the stored categories with only their selected terms
   * IDs match the categories under the Glossary objects
   * Can contain selected free fields
   */
  public selectedJumpIDTerms: GlossaryCategoryDBFormat[];
  public glossaryJumpIDName: string;
  public delimiter: string;
  public campaignType: string;
  public claim: { ownerId: string | null; groupId: string; claim: string };
  public id: string | null;

  public selectedCategoriesAndTerms: GlossaryCategoryDBFormat[];

  public unusedFreeFields: GlossaryCategoryDBFormat[];

  constructor(dto: TaxonomyTemplateDto) {
    this.creationTime = dto.creationTime;
    this.parent = dto.parent;
    this.templateName = dto.templateName;
    this.parentId = dto.parentId;
    this.business = dto.business;
    this.glossaryId = dto.glossaryId;
    this.glossaryName = dto.glossaryName;
    this.glossaryJumpIDId = dto.glossaryJumpIDId;
    this.glossaryJumpIDName = dto.glossaryJumpIDName;
    this.delimiter = dto.delimiter;
    this.campaignType = dto.campaignType;
    this.claim = dto.claim;
    this.id = dto.id;

    this.selectedCategoriesAndTerms = dto.selectedTerms.map((categoryDto) => {
      return Object.assign({}, new GlossaryCategoryDBFormat().convertFromDto(categoryDto));
    });

    // Has to convert to plain object
    this.unusedFreeFields = dto.unusedFreeFields.map((unusedFreeFields) => {
      return Object.assign({}, new GlossaryCategoryDBFormat().convertFromDto(unusedFreeFields));
    });
    this.selectedJumpIDTerms = dto.selectedJumpIDTerms.map((fields) => {
      return Object.assign({}, new GlossaryCategoryDBFormat().convertFromDto(fields));
    });
  }
}

/**
 * Database format object for ease of communicating with DB
 */
export class GlossaryCategoryDBFormat {
  categoryId: string; // Matches the category ID from the glossary categories
  creationTime: number | null;
  name: string; // Category name
  freeField: boolean; // true if represents a free field
  isActive: boolean; // true if the field is present for user interaction
  /**
   * Map of key/value pairs for terms
   * going to be an object with keys as variable names.
   *
   * so Map<string, string> will look like: {"Year 2022" => "2022"}, {"Year 2021" => "2021"}
   * object form looks like: {Year 2022: '2022', Year 2021: '2021'}
   */
  terms: { [key: string]: string };

  constructor() { }

  public convertFromDto(category: GlossaryCategoryDto): GlossaryCategoryDBFormat {
    let dbFormat = new GlossaryCategoryDBFormat();
    let termsObject = {};
    if (category.terms !== undefined) {
      category.terms.forEach((value: string, key: string) => {
        termsObject[key] = value;
      });
    }
    dbFormat.categoryId = category.id;
    dbFormat.name = category.name;
    dbFormat.freeField = category.freeField !== undefined ? category.freeField : false;
    dbFormat.terms = termsObject;
    dbFormat.isActive = category.isActive;
    return dbFormat;
  }

  public convertToDto(): GlossaryCategoryDto {
    let categoryDto = Object.assign(new GlossaryCategoryDto(), this) as GlossaryCategoryDto;
    categoryDto.id = this.categoryId;
    categoryDto.freeField = this.freeField;
    categoryDto.isActive = this.isActive;
    if (categoryDto.terms !== undefined) {
      // Necessary to convert from Object to Map
      const map: Map<string, string> = new Map(Object.entries(categoryDto.terms));
      const terms = new BiMapBuilder<string, string>().empty();
      map.forEach((value, key) => {
        terms.set(key, value);
      });
      categoryDto.terms = terms;
    }
    return categoryDto;
  }
}
export class TaxonomyTemplateDao {
  private _COLLECTION_REF = 'taxonomyTemplate';
  private db: firebase.firestore.Firestore;

  constructor() {
    this.db = firebase.firestore();
  }

  public async getAll(): Promise<TaxonomyTemplateDto[]> {
    const query = this.db.collection(this._COLLECTION_REF);
    const querySnapshot = await query.get();
    const queryResults = querySnapshot.docs;
    return TaxonomyTemplateDao._createFromQuery(queryResults);
  }

  public async create(item: TaxonomyTemplateDto) {
    const dbObject = new TaxonomyTemplateDBFormat(item);
    const query = this.db.collection(this._COLLECTION_REF);
    dbObject.creationTime = firebase.firestore.Timestamp.now().seconds;
    const successPromise: CreationReturnObject = await query
      .add({ ...dbObject })
      .then((value) => {
        return { success: true, docId: value.id };
      })
      .catch((e) => {
        console.error(e);
        return { success: false, docId: '' };
      });
    return successPromise;
  }

  public async get(id: string): Promise<TaxonomyTemplateDto> {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(id);
    const querySnapshot = await docRef.get();
    const doc = querySnapshot.data() as TaxonomyTemplateDto;
    doc.id = querySnapshot.id;
    return doc;
  }

  public set(item: TaxonomyTemplateDto) {
    const dbObject = new TaxonomyTemplateDBFormat(item);
    const docRef = this.db.collection(this._COLLECTION_REF).doc(dbObject.id || '');

    docRef.update({ ...dbObject }).catch((e) => {
      console.error(e);
      return false;
    });
    return true;
  }

  public async delete(item: TaxonomyTemplateDto) {
    const docRef = this.db.collection(this._COLLECTION_REF).doc(item.id || '');
    const successPromise = await docRef
      .delete()
      .then((value) => {
        if (item.parent) {
          this.deleteChildren(item.id || '', item.claim.groupId);
        }
        return true;
      })
      .catch((e) => {
        console.error(e);
        return false;
      });
    return successPromise;
  }

  public async listChildren(templateId: string, groupId: string) {
    const querySnapshot = await this.db.collection(this._COLLECTION_REF).where('parentId', '==', templateId).where('claim.groupId', '==', groupId).get();
    const queryDocs = querySnapshot.docs;
    return queryDocs;
  }

  // Based off this SO post: https://stackoverflow.com/a/68388742
  public async deleteChildren(templateId: string, groupId: string) {
    const docs = await this.listChildren(templateId, groupId);
    if (docs.length > 0) {
      const writeBatch = this.db.batch();
      docs.forEach((queryDocumentSnapshot) => {
        const docRef = queryDocumentSnapshot.ref;
        writeBatch.delete(docRef);
      });
      return await writeBatch
        .commit()
        .then((val) => {
          return true;
        })
        .catch((error) => {
          console.error('Something went wrong deleting child templates', error);
        });
    }
  }

  public watchForChanges(clientId: string, callback: (resultList: TaxonomyTemplateDto[]) => void, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).where('claim.groupId', '==', clientId);
    query
      .onSnapshot(
        (docs) => {
          const resultList = TaxonomyTemplateDao._createFromQuery(docs.docs);
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

  public watchDocumentForChanges(callback: (resultList?: TaxonomyTemplateDto) => void, docId: string, errorCallback?: (error: Error) => void) {
    const query = this.db.collection(this._COLLECTION_REF).doc(docId);
    query
      .onSnapshot(
        (doc) => {
          const resultList = doc.data() as TaxonomyTemplateDto | undefined;
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

  public static _createFromQuery(docs: firebase.firestore.QueryDocumentSnapshot[]): TaxonomyTemplateDto[] {
    const result: TaxonomyTemplateDto[] = [];
    if (docs !== undefined && docs != null) {
      docs.forEach((element) => {
        if (element.exists) {
          const dto = element.data() as TaxonomyTemplateDto;
          dto.id = element.id;
          const selectedTermsDbFormat = element.data().selectedCategoriesAndTerms as GlossaryCategoryDBFormat[];
          if (selectedTermsDbFormat !== undefined) {
            dto.selectedTerms = selectedTermsDbFormat.map((categoryDBFormat) => {
              return Object.assign(new GlossaryCategoryDBFormat(), categoryDBFormat).convertToDto();
            });
          }
          const unusedFreeFields = element.data().unusedFreeFields as GlossaryCategoryDBFormat[];
          if (unusedFreeFields !== undefined) {
            dto.unusedFreeFields = unusedFreeFields.map((unusedFreeFields) => {
              return Object.assign(new GlossaryCategoryDBFormat(), unusedFreeFields).convertToDto();
            });
          }
          const selectedJumpIDTerms = element.data().selectedJumpIDTerms as GlossaryCategoryDBFormat[];
          if (selectedJumpIDTerms !== undefined) {
            dto.selectedJumpIDTerms = selectedJumpIDTerms.map((selectedJumpIDTerms) => {
              return Object.assign(new GlossaryCategoryDBFormat(), selectedJumpIDTerms).convertToDto();
            });
          }
          result.push(dto);
        }
      });
    }
    return result;
  }
}
