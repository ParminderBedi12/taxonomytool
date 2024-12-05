/**
 * A type-invariant bi-directional Map where keys and values have a one-to-one mapping.
 *
 * @typeparam K - the key type
 * @typeparam V - the value type
 */
export class BiMap<K, V> {
  private fwdMap = new Map<K, V>();
  private revMap = new Map<V, K>();

  /**
   * Used to iterate over the BiMap
   * @param callbackfn
   * @param thisArg
   */
  public forEach(callbackfn: (value: V, key: K, map: BiMap<K, V>) => void, thisArg?: any): void {
    this.fwdMap.forEach((value, key) => {
      callbackfn(value, key, this);
    });
  }

  /**
   *
   * @returns True if maps is empty
   */
  public isEmpty(): boolean {
    return this.size() == 0;
  }

  /**
   *
   * @returns Size of map
   */
  public size(): number {
    return this.fwdMap.size;
  }

  /**
   *
   * @param key
   * @returns True if key is in map
   */
  public containsKey(key: K): boolean {
    return this.fwdMap.has(key);
  }

  /**
   *
   * @param value
   * @returns True if value is in map
   */
  public containsValue(value: V): boolean {
    return this.revMap.has(value);
  }
  /**
   * Get entry by key
   * @param key
   * @returns
   */
  public getByKey(key: K): V | undefined {
    return this.fwdMap.get(key);
  }

  /**
   * Get entry by value
   * @param value
   * @returns
   */
  public getByValue(value: V): K | undefined {
    return this.revMap.get(value);
  }

  /**
   * Set a key value pair
   * Errors when duplicate is attempted to be written
   * @param key
   * @param value
   */
  public set(key: K, value: V) {
    if (this.fwdMap.has(key)) {
      throw new Error(`Key '${key}' exists already in the map with Value '${this.fwdMap.get(key)}'`);
    }

    if (this.revMap.has(value)) {
      throw new Error(`Key '${key}' exists already in the map with Value '${this.revMap.get(value)}'`);
    }

    this.fwdMap.set(key, value);
    this.revMap.set(value, key);
  }

  /**
   * Forces a set - overwrites any existing references to key or value
   * @param key
   * @param value
   */
  public forceSet(key: K, value: V) {
    // Skip if set already exists
    if (this.fwdMap.has(key) && this.fwdMap.get(key) == value) {
      return;
    }

    // If key already exists, delete key and its value from all maps
    if (this.fwdMap.has(key)) {
      const oldKeyValue = this.fwdMap.get(key) as V;
      this.fwdMap.delete(key);
      this.revMap.delete(oldKeyValue);
    }

    // If value already exists, delete key and its value from all maps
    if (this.revMap.has(value)) {
      const oldValueKey = this.revMap.get(value) as K;
      this.fwdMap.delete(oldValueKey);
      this.revMap.delete(value);
    }

    this.fwdMap.set(key, value);
    this.revMap.set(value, key);
  }

  /**
   * Delete entry by key
   * @param key
   * @returns
   */
  public deleteByKey(key: K): V | undefined {
    if (!this.fwdMap.has(key)) {
      return undefined;
    }
    const value = this.fwdMap.get(key) as V;
    this.fwdMap.delete(key);
    this.revMap.delete(value);
    return value;
  }

  /**
   * Delete entry by value
   * @param value
   * @returns
   */
  public deleteByValue(value: V): K | undefined {
    if (!this.revMap.has(value)) {
      return undefined;
    }
    const key = this.revMap.get(value) as K;
    this.fwdMap.delete(key);
    this.revMap.delete(value);
  }

  /**
   * Returns a set of all keys in the map
   * @returns
   */
  public keys(): Set<K> {
    return new Set(this.fwdMap.keys());
  }
  /**
   * Returns a set of all values in the map
   * @returns
   */
  public values(): Set<V> {
    return new Set(this.fwdMap.values());
  }
}

/**
 * Used for building BiMaps
 */
export class BiMapBuilder<K, V> {
  /**
   * Constructs empty BiMap
   * @returns
   */
  public empty(): BiMap<K, V> {
    return new BiMap<K, V>();
  }

  /**
   * Constructs BiMap from Map
   * Throws error when constraint failures exist
   * @param map
   * @returns
   */
  public of(map: Map<K, V>): BiMap<K, V> {
    let bimap = new BiMap<K, V>();

    map.forEach((value, key) => {
      bimap.set(key, value);
    });

    return bimap;
  }
}
