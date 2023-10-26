export const filterArrayByDeltaAndCutoff = (inputArray, delta, cutoff) => {
    if (inputArray.length === 0) {
      return [];
    }
    const filteredArray = [];
    for (let i = 0; i < inputArray.length; i++) {
      const currentSimilarity = inputArray[i].similarity;
      if (currentSimilarity < cutoff) {
        break; 
      }
      if (i === 0 || filteredArray[filteredArray.length - 1].similarity - currentSimilarity < delta) {
        filteredArray.push(inputArray[i]);
      }
    }
    return filteredArray;
}

export const uniqueUnion = (jsonArray1, jsonArray2) => {
    const uniqueSet = new Set();
    const similarities = {}
    jsonArray1.forEach((item) => {
        similarities[`${item.id}`] = item.similarity
        delete item.similarity
        return uniqueSet.add(JSON.stringify(item))
    });
    jsonArray2.forEach((item) => {
        similarities[`${item.id}`] = item.similarity
        delete item.similarity
        return uniqueSet.add(JSON.stringify(item))
    });
    console.log(jsonArray1,jsonArray2)
    const uniqueArray = [...uniqueSet].map((item:any) => {
        let res = JSON.parse(item)
        res['similarity'] = similarities[`${res.id}`]
        return res
    });
    
    return uniqueArray;
}

export const filterUnique = (filterIds, array) => {
  const uniqueIds = new Set();
  return array.filter(item => {
      if (filterIds.includes(item.id) && !uniqueIds.has(item.id)) {
        uniqueIds.add(item.id);
        return true;
      }
      return false;
  });
}