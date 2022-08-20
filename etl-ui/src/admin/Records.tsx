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
  ChipField,
  required,
  DeleteButton,
  FileInput,
  FileField,
  UrlField,
  Labeled,
  FunctionField,
  WrapperField,
} from "react-admin";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import CalculateIcon from "@mui/icons-material/Calculate";
import CloudDoneIcon from "@mui/icons-material/CloudDone";
import ErrorIcon from "@mui/icons-material/Error";
import PendingIcon from "@mui/icons-material/Pending";
import { EtlButton } from "../components/EtlButton";
import { DateTimeListItem } from "../components/DateTimeListItem";

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
      <WrapperField label="Primary key" textAlign="center">
        <TextField source="merchantId" />
        <ChipField source="partnerId" />
      </WrapperField>
      <UrlField source="s3Key" />
      <FunctionField
        label="Status"
        render={(record: any) => {
          switch (record.etlStatus) {
            case "success":
              return <CloudDoneIcon color="success" />;
            case "failed":
              return <ErrorIcon color="error" />;
            case "processing":
              return <CircularProgress />;
            default:
              return <PendingIcon />;
          }
        }}
      />
      <FunctionField
        sx={{ display: "flex" }}
        label="Etl result"
        render={(record: any) => (
          <WrapperField>
            <CalculateIcon color="info" fontSize="small" />{" "}
            {record.etlResult.total}
            <CheckCircleIcon color="success" fontSize="small" />{" "}
            {record.etlResult.valid}
            <CancelIcon color="error" fontSize="small" />{" "}
            {record.etlResult.invalid}
          </WrapperField>
        )}
      />
      <DateTimeListItem source="createdAt" />
      <DateTimeListItem source="updatedAt" />
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
