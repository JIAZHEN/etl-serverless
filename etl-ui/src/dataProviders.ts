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
  create: async (resource: string, params: any) => {
    if (resource !== "etl-records") {
      return etlRecordsOriginDataProvider.create(resource, params);
    }
    const partnerFile = params.data.partnerFile;
    const createParams = {
      ...params.data,
      partnerFile: { filename: partnerFile.title },
    };

    const presignedUrl = await createUploadPresignedUrl(resource, createParams);
    await uploadFileToS3(presignedUrl, partnerFile);
    return etlRecordsOriginDataProvider.create(resource, {
      data: createParams,
    });
  },
  process: (resource: string, params: any) => {
    return fetch(`${etlRecordApi}/${resource}/${params.id}/process`, {
      method: "POST",
    }).then((response) => response.json());
  },
};

const createUploadPresignedUrl = async (
  resource: string,
  createParams: any
) => {
  const presignedEndpoint = `${etlRecordApi}/${resource}/createS3PresignedUrl`;
  const presignedResponse = await fetch(presignedEndpoint, {
    method: "POST",
    body: JSON.stringify(createParams),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const presignedResponseJson = await presignedResponse.json();
  return presignedResponseJson.presignedUrl;
};

const uploadFileToS3 = async (presignedUrl: string, partnerFile: any) => {
  const rawFile = partnerFile.rawFile;
  const formData = new FormData();
  formData.append("myfile", rawFile);
  // const fileContent = convertFileToBinaryString(rawFile);
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: formData,
  });
  await response.text();
};

const convertFileToBinaryString = async (rawFile: Blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(rawFile);
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
