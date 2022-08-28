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
  useGetIdentity,
} from "react-admin";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Tooltip,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Calculate,
  CheckCircle,
  Cancel,
  CloudDone,
  Error,
  Pending,
} from "@mui/icons-material";
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

export const RecordList = () => {
  const { identity, isLoading } = useGetIdentity();
  if (isLoading) return <>Loading...</>;

  return (
    <List filter={{ merchantId: identity?.fullName }}>
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
                return (
                  <Tooltip title={record.etlStatus}>
                    <CloudDone color="success" />
                  </Tooltip>
                );
              case "failed":
                return (
                  <Tooltip title={record.etlStatus}>
                    <Error color="error" />
                  </Tooltip>
                );
              case "processing":
                return (
                  <Tooltip title={record.etlStatus}>
                    <CircularProgress />
                  </Tooltip>
                );
              default:
                return (
                  <Tooltip title={record.etlStatus}>
                    <Pending />
                  </Tooltip>
                );
            }
          }}
        />
        <FunctionField
          sx={{ display: "flex" }}
          label="Etl result"
          render={(record: any) => (
            <WrapperField>
              <Calculate color="info" fontSize="small" />{" "}
              {record.etlResult.total?.toLocaleString("en-GB")}
              <CheckCircle color="success" fontSize="small" />{" "}
              {record.etlResult.valid?.toLocaleString("en-GB")}
              <Cancel color="error" fontSize="small" />{" "}
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
};

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
                    {record.etlResult[numberAttr]?.toLocaleString("en-GB")}
                  </Typography>
                )}
              />
            </Grid>
            <Grid item>
              <Avatar sx={avatarSx}>
                {numberAttr === "total" && <Calculate />}
                {numberAttr === "valid" && <CheckCircle />}
                {numberAttr === "invalid" && <Cancel />}
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
                return <CloudDone color="success" />;
              case "failed":
                return <Error color="error" />;
              case "processing":
                return <CircularProgress />;
              default:
                return <Pending />;
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
          render={(record) =>
            record.etlResult.errors && (
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
                            {record.etlResult.errors[key].toLocaleString(
                              "en-GB"
                            )}
                          </Typography>
                        )}
                      />
                    </>
                  );
                })}
              </>
            )
          }
        />
      </SimpleShowLayout>
    </Show>
  );
};
