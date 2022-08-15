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
  RadioButtonGroupInput,
  FunctionField,
  RaRecord,
} from "react-admin";

type RuleInput = {
  partner: string;
  field: string;
  operator: string;
  value: string;
};

const OPERATORS = [
  { id: "equal", name: "Equals to" },
  { id: "notEqual", name: "Not equal" },
  { id: "in", name: "In" },
  { id: "notIn", name: "Not in" },
  { id: "contains", name: "Contains" },
  { id: "doesNotContain", name: "Does not contain" },
  { id: "lessThan", name: "Less than" },
  { id: "lessThanInclusive", name: "Less than inclusive" },
  { id: "greaterThan", name: "Greater than" },
  { id: "greaterThanInclusive", name: "Greater than inclusive" },
];
const CONSEQUENCES = [
  { id: "row-valid", name: "Row valid" },
  { id: "row-invalid", name: "Row invalid" },
];

export const RuleList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="merchantId" />
      <ChipField source="partnerId" />
      <TextField label="Rule name" source="event.type" />
      <TextField label="Rule consequence" source="event.params.consequence" />
      <FunctionField
        label="Rule"
        render={(record: RaRecord) =>
          `${record.rule.fact} ${record.rule.operator} ${record.rule.value}`
        }
      />
      <DateField source="createdAt" showTime={true} locales={"en-GB"} />
      <DateField source="updatedAt" showTime={true} locales={"en-GB"} />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const RuleEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" />
      <TextInput source="merchantId" validate={[required()]} fullWidth />
      <TextInput source="partnerId" validate={[required()]} fullWidth />
      <TextInput
        source="event.type"
        label="Rule name"
        helperText="Rule name one word with hyphen. custom-rule-one"
        validate={[required()]}
      />
      <RadioButtonGroupInput
        label="Rule consequence"
        source="event.params.consequence"
        choices={CONSEQUENCES}
        validate={[required()]}
      />
      <TextInput source="rule.fact" validate={[required()]} />
      <SelectInput source="rule.operator" choices={OPERATORS} />
      <TextInput source="rule.value" validate={[required()]} />
    </SimpleForm>
  </Edit>
);

export const RuleCreate = (props: RuleInput) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="merchantId" validate={[required()]} fullWidth />
      <TextInput source="partnerId" validate={[required()]} fullWidth />
      <TextInput
        source="event.type"
        label="Rule name"
        helperText="Rule name one word with hyphen. custom-rule-one"
        validate={[required()]}
      />
      <RadioButtonGroupInput
        label="Rule consequence"
        source="event.params.consequence"
        choices={CONSEQUENCES}
        validate={[required()]}
      />
      <TextInput source="rule.fact" validate={[required()]} />
      <SelectInput source="rule.operator" choices={OPERATORS} />
      <TextInput source="rule.value" validate={[required()]} />
    </SimpleForm>
  </Create>
);
