const getBatch = ({
  busyListSet,
  expand,
  fetcher,
  listSet,
  res,
  resultsKey
}: {
  busyListSet: any,
  expand?: boolean,
  fetcher?: any,
  listSet: any,
  res: any,
  resultsKey: string
}) => {
  let tokens = res.results.map((item: any) => item.weight_token);
  busyListSet(tokens.reduce((obj = {},token = "") => ({ ...obj, [token]: true }),{})); // add current batch to busy list
  fetcher("",{},{ tokens }).then((res: any) => {
    if (res.success && res[resultsKey]) {
      let newBatch = res[resultsKey].reduce((obj = {}, { entity_token = "", ...current }) => ({
        ...obj,
        [entity_token]: current
      }),{});
      busyListSet({}); // this should be a for each key in tokens delete from busyList, but this is fine for now
      listSet((list: any) => expand ? { ...list, ...newBatch } : newBatch);
    }
  })
};

export default getBatch;