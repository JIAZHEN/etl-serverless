import * as React from "react";
import { TextInput, required, useGetIdentity } from "react-admin";

export const MerchantIdField = () => {
  const { identity, isLoading } = useGetIdentity();
  if (isLoading) return <>Loading...</>;

  return (
    <TextInput
      source="merchantId"
      validate={[required()]}
      defaultValue={identity?.fullName}
      disabled={true}
    />
  );
};
