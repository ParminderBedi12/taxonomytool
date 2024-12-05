import { BiMap } from '@mightyhive/material-components';
import 'firebase/firestore';
import { ClaimDto } from './ClaimDto';
export class GlossaryItemDto {
  public id: string; // Firebase ID
  public creationTime: number | null; //Time document was created
  public name: string; // Glossary Name
  public claim: ClaimDto | null; // Claim
}

/**
 * Glossary category
 */
export class GlossaryCategoryDto {
  public id: string; // Firebase ID
  public creationTime: number | null; //Time document was created
  public name: string; // Category name
  public freeField: boolean; // True if this is a free field
  public terms: BiMap<string, string>; // Map of key/value pairs for terms
  public isActive: boolean; // If the category is active for user input

  /**
   * Creates a deep copy of the object
   * @returns
   */
  public deepCopy(): GlossaryCategoryDto {
    let copy = new GlossaryCategoryDto();
    copy.id = this.id;
    copy.creationTime = this.creationTime;
    copy.name = this.name;
    copy.freeField = this.freeField;
    copy.terms = new BiMap<string, string>();
    copy.isActive = this.isActive;
    this.terms.forEach((value, key) => {
      copy.terms.set(key, value);
    });
    return copy;
  }

  /**
   * Creates from a free field object
   * @param name
   * @param terms
   * @returns
   */
  static createFromFreeField(name: string, terms: Set<string>): GlossaryCategoryDto {
    let newCategory = new GlossaryCategoryDto();
    newCategory.id = name;
    newCategory.name = name;
    newCategory.freeField = true;
    newCategory.terms = new BiMap<string, string>();
    newCategory.isActive = true;
    terms.forEach((value) => {
      newCategory.terms.set(value, value);
    });
    return newCategory;
  }
}
