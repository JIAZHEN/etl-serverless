import jsonServerProvider from "ra-data-json-server";
import { combineDataProviders } from "react-admin";

const etlRulesDataProvider = jsonServerProvider(
  "https://rxisckfi42.execute-api.eu-west-1.amazonaws.com/prod"
);
const etlRecordApi =
  "https://abyxqaixu4.execute-api.eu-west-1.amazonaws.com/prod";
const etlRecordsOriginDataProvider = jsonServerProvider(etlRecordApi);
const etlRecordsDataProvider = {
  ...etlRecordsOriginDataProvider,
  create: (resource: string, params: any) => {
    if (resource !== "etl-records") {
      return etlRecordsOriginDataProvider.create(resource, params);
    }
    const partnerFile = params.data.partnerFile;
    return convertFileToBinaryString(partnerFile).then((fileContent) =>
      etlRecordsOriginDataProvider.create(resource, {
        data: {
          ...params.data,
          partnerFile: { filename: partnerFile.title, content: fileContent },
        },
      })
    );
  },
  process: (resource: string, params: any) => {
    return fetch(`${etlRecordApi}/${resource}/${params.id}/process`, {
      method: "POST",
    }).then((response) => response.json());
  },
};

const convertFileToBinaryString = (file: any) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsBinaryString(file.rawFile);
  });

export const dataProviders = combineDataProviders((resource) => {
  switch (resource) {
    case "etl-rules":
      return etlRulesDataProvider;
    case "etl-records":
      return etlRecordsDataProvider;
    default:
      throw new Error(`Unknown resource: ${resource}`);
  }
});
