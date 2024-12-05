import { GlossaryCategoryDto } from './GlossaryItemDto';

/**
 * Document Object for taxonomy template
 */
export default class TaxonomyTemplateDto {
  /**
   * Time document was created
   */
  public creationTime: number | null;
  /**
   * Name of the template, the additional name text
   */
  public templateName: string;
  /**
   * True if a parent exists, currently a placeholder
   */
  public parent: boolean;
  /**
   * Parent Id, currently a placeholder
   */
  public parentId: string;
  /**
   * business attribute
   */
  public business: string;
  /**
   * Glossary id
   */
  public glossaryId: string;
  /**
   * Glossary name metadata
   */
  public glossaryName: string;
  /**
 * Glossary id
 */
  public glossaryJumpIDId: string;
  /**
  * Glossary name metadata
  */
  public glossaryJumpIDName: string;
  /**
   * These are the stored categories with only their selected terms
   * IDs match the categories under the Glossary objects
   * Can contain selected free fields
   */
  public selectedTerms: GlossaryCategoryDto[];
  /**
   * These are the stored categories with only their selected terms
   * IDs match the categories under the Glossary objects
   * Can contain selected free fields
   */
  public selectedJumpIDTerms: GlossaryCategoryDto[];
  /**
   * Unused free fields to be saved to DB
   */
  public unusedFreeFields: GlossaryCategoryDto[];
  /**
   * Delimiter String to seperate generated string by
   */
  public delimiter: string;
  /**
   * Campaign type attribue
   */
  public campaignType: string;
  /**
   * Access claim by groupId
   */
  public claim: { ownerId: string | null; groupId: string; claim: string };
  /**
   * id of the document itself
   */
  public id: string | null;

  constructor(
    clientId: string,
    parent: boolean,
    templateName: string,
    business: string,
    glossaryId: string,
    glossaryName: string,
    glossaryJumpIDId: string,
    glossaryJumpIDName: string,
    selectedTerms: GlossaryCategoryDto[],
    unusedFreeFields: GlossaryCategoryDto[],
    selectedJumpIDTerms:  GlossaryCategoryDto[],
    delimiter: string,
    campaignType: string,
    parentId: string,
  ) {
    this.parent = parent;
    this.templateName = templateName;
    this.business = business;
    this.glossaryId = glossaryId;
    this.glossaryName = glossaryName;
    this.glossaryJumpIDId = glossaryJumpIDId;
    this.glossaryJumpIDName = glossaryJumpIDName;
    this.selectedTerms = selectedTerms;
    this.selectedJumpIDTerms = selectedJumpIDTerms;
    this.unusedFreeFields = unusedFreeFields;
    this.delimiter = delimiter;
    this.campaignType = campaignType;
    this.parentId = parentId;
    this.claim = { ownerId: null, groupId: clientId, claim: '' };
    this.id = null;
  }

  static defaultsConstructor() {
    return new TaxonomyTemplateDto('', false, '', '', '', '',  '', '', [], [], [], '', '', '');
  }
}
