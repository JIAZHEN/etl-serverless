import { useRecordContext } from "react-admin";
import { TextField } from "react-admin";
import CircularProgress from "@mui/material/CircularProgress";

export const StatusColumn = () => {
  const record = useRecordContext();

  return (
    <>
      {record.etlStatus === "processing" && <CircularProgress />}
      <TextField label="Status" source="etlStatus" />
    </>
  );
};
