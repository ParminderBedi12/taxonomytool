import firebase from 'firebase/app';
import 'firebase/firestore';
import GeneratedTaxonomyDto from './GeneratedTaxonomyDto';
import {CreationReturnObject, GlossaryCategoryDBFormat} from './TaxonomyTemplateDao'

class GeneratedTaxonomyDBFormat {
    public creationTime: number | null;
    public user: string;
    public id: string | null;
    public jumpId: string;
    public taxonomyStrings: string[];
    public delimiter: string;
    /**
     * These are the stored categories with only their selected terms
     * IDs match the categories under the Glossary objects
     * Can contain selected free fields
     */
    public selectedTerms: GlossaryCategoryDBFormat[];
    
    constructor(dto: GeneratedTaxonomyDto) {
        this.id = dto.id;
        this.user = dto.user;
        this.jumpId = dto.jumpId;
        this.taxonomyStrings = dto.taxonomyStrings;
        this.delimiter = dto.delimiter;
        this.selectedTerms = dto.selectedTerms.map((fields) => {
            return Object.assign({}, new GlossaryCategoryDBFormat().convertFromDto(fields));
          });
      }
}

/**
 * Class for accessing taxonomy string archives
 */
export class GeneratedTaxonomyDao {
    private _COLLECTION_REF = 'generatedTaxonomy';
    private db: firebase.firestore.Firestore;
  
    constructor() {
      this.db = firebase.firestore();
    }

    public async create(item: GeneratedTaxonomyDto) {
        const dbObject = new GeneratedTaxonomyDBFormat(item);
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
}