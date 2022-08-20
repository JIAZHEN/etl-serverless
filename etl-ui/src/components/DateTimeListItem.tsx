import { useRecordContext } from "react-admin";
import { ListItemText } from "@mui/material";

export const DateTimeListItem = (props: any) => {
  const record = useRecordContext();
  const dateTime = new Date(record[props.source]);

  return record ? (
    <ListItemText
      primary={dateTime.toLocaleDateString("en-GB")}
      primaryTypographyProps={{ fontSize: "1em" }}
      secondary={dateTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    />
  ) : null;
};
