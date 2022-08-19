import * as React from "react";
import {
  List,
  Datagrid,
  TextField,
  EditButton,
  Edit,
  SimpleForm,
  TextInput,
  Create,
  SelectInput,
  DateField,
  ChipField,
  required,
  DeleteButton,
  FileInput,
  FileField,
  UrlField,
  Labeled,
} from "react-admin";
import { EtlButton } from "../components/EtlButton";
import { StatusColumn } from "../components/StatusColumn";

type EtlRecordInput = {
  partnerId: string;
  merchantId: string;
  [key: string]: any;
};

const ETL_STATUS = [
  { id: "pending", name: "pending" },
  { id: "processing", name: "processing" },
  { id: "failed", name: "failed" },
  { id: "success", name: "success" },
];

export const RecordList = () => (
  <List>
    <Datagrid>
      <TextField source="id" />
      <TextField source="merchantId" />
      <ChipField source="partnerId" />
      <UrlField source="s3Key" />
      <StatusColumn />
      <TextField source="etlResult" />
      <DateField source="createdAt" showTime={true} locales={"en-GB"} />
      <DateField source="updatedAt" showTime={true} locales={"en-GB"} />
      <EtlButton />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const RecordEdit = () => (
  <Edit>
    <SimpleForm>
      <TextField source="id" />
      <TextInput source="merchantId" validate={[required()]} />
      <TextInput source="partnerId" validate={[required()]} />
      <SelectInput source="etlStatus" choices={ETL_STATUS} />
      <Labeled label="S3 Key">
        <TextField source="s3Key" />
      </Labeled>
    </SimpleForm>
  </Edit>
);

export const RecordCreate = (props: EtlRecordInput) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="merchantId" validate={[required()]} />
      <TextInput source="partnerId" validate={[required()]} />
      <FileInput source="partnerFile" accept="text/csv">
        <FileField source="src" title="title" />
      </FileInput>
    </SimpleForm>
  </Create>
);
