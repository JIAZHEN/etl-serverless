import { useDataProvider, useRecordContext } from "react-admin";
import { Button } from "react-admin";
import { useMutation } from "react-query";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

export const EtlButton = () => {
  const dataProvider = useDataProvider();
  const record = useRecordContext();
  const { mutate, isLoading } = useMutation(["process", record.id], () => {
    return dataProvider.process("etl-records", { id: record.id });
  });

  return (
    <Button
      size="small"
      startIcon={<PlayArrowIcon />}
      label="ETL"
      onClick={() => mutate()}
      disabled={isLoading}
    />
  );
};
