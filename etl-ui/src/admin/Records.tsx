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
  WithRecord,
  Show,
  SimpleShowLayout,
} from "react-admin";
import { Card, CardContent, Grid, Typography, Avatar } from "@mui/material";
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
    <Datagrid rowClick="show">
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
            {record.etlResult.total?.toLocaleString("en-GB")}
            <CheckCircleIcon color="success" fontSize="small" />{" "}
            {record.etlResult.valid?.toLocaleString("en-GB")}
            <CancelIcon color="error" fontSize="small" />{" "}
            {record.etlResult.invalid?.toLocaleString("en-GB")}
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

const RecordCard = ({
  title,
  numberAttr,
  avatarSx,
}: {
  title: string;
  numberAttr: string;
  avatarSx: object;
}) => {
  return (
    <Grid item sm={6}>
      <Card>
        <CardContent>
          <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
            <Grid item>
              <Typography color="textSecondary" gutterBottom variant="overline">
                {title}
              </Typography>
              <WithRecord
                label="Rating"
                render={(record) => (
                  <Typography color="textPrimary" variant="h4">
                    {record.etlResult[numberAttr].toLocaleString("en-GB")}
                  </Typography>
                )}
              />
            </Grid>
            <Grid item>
              <Avatar sx={avatarSx}>
                {numberAttr === "total" && <CalculateIcon />}
                {numberAttr === "valid" && <CheckCircleIcon />}
                {numberAttr === "invalid" && <CancelIcon />}
              </Avatar>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export const RecordShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="merchantId" />
        <TextField source="partnerId" />
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
        <Grid container spacing={3} sx={{ justifyContent: "space-between" }}>
          <RecordCard
            title="Valid"
            numberAttr="valid"
            avatarSx={{ backgroundColor: "success.main" }}
          />
          <RecordCard
            title="TOTAL"
            numberAttr="total"
            avatarSx={{ backgroundColor: "primary.main" }}
          />
          <RecordCard
            title="Invalid"
            numberAttr="invalid"
            avatarSx={{ backgroundColor: "error.main" }}
          />
        </Grid>
        <WithRecord
          render={(record) => (
            <>
              {Object.keys(record.etlResult.errors).map((key) => {
                return (
                  <>
                    <Typography
                      color="textSecondary"
                      gutterBottom
                      variant="overline"
                    >
                      {key}
                    </Typography>
                    <WithRecord
                      label="Rating"
                      render={(record) => (
                        <Typography color="textPrimary" variant="h6">
                          {record.etlResult.errors[key].toLocaleString("en-GB")}
                        </Typography>
                      )}
                    />
                  </>
                );
              })}
            </>
          )}
        />
      </SimpleShowLayout>
    </Show>
  );
};
