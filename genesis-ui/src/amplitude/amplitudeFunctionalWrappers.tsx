/**
 * Cleans inputs for amplitude event parameters. Undefined propertied should not exist.
 * @param inputElements elements to removed undefined entries from so amplitude is happy.
 */
function removeUndefinedEntries(inputElements: { [key: string]: any }): object {
  const returnMap = {};
  for (const key in inputElements) {
    if (inputElements[key] !== undefined) {
      returnMap[key] = inputElements[key];
    }
  }
  return returnMap;
}

export default removeUndefinedEntries;
