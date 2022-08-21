import * as React from "react";
import { FormDataConsumer } from "react-admin";
import { TextInput, required } from "react-admin";

export const AutoNameField = () => {
  return (
    <FormDataConsumer>
      {({ formData }) => (
        <TextInput
          source="event.params.name"
          label="Rule name"
          helperText="Rule name one word with hyphen. custom-rule-one"
          defaultValue={[
            formData?.rule?.fact,
            formData?.rule?.operator,
            formData?.rule?.value,
          ].join("-")}
          validate={[required()]}
        />
      )}
    </FormDataConsumer>
  );
};
