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
  RadioButtonGroupInput,
  WrapperField,
} from "react-admin";
import { AutoNameField } from "../components/AutoNameField";
import { DateTimeListItem } from "../components/DateTimeListItem";

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
const RULE_TYPES = [
  { id: "row-valid", name: "Row valid" },
  { id: "row-invalid", name: "Row invalid" },
];

export const RuleList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <WrapperField label="Primary key" textAlign="center">
        <TextField source="merchantId" />
        <ChipField source="partnerId" />
      </WrapperField>
      <TextField label="Rule name" source="event.params.name" />
      <TextField label="Rule type" source="event.type" />
      <TextField label="Rule field" source="rule.fact" />
      <TextField label="Rule operator" source="rule.operator" />
      <TextField label="Rule value" source="rule.value" />
      <DateTimeListItem source="createdAt" />
      <DateTimeListItem source="updatedAt" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export const RuleEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput disabled={true} source="id" label="ID" fullWidth />
      <TextInput source="merchantId" validate={[required()]} fullWidth />
      <TextInput source="partnerId" validate={[required()]} fullWidth />
      <RadioButtonGroupInput
        label="Rule type"
        source="event.type"
        choices={RULE_TYPES}
        validate={[required()]}
      />
      <TextInput source="rule.fact" validate={[required()]} />
      <SelectInput source="rule.operator" choices={OPERATORS} />
      <TextInput source="rule.value" validate={[required()]} />
      <AutoNameField />
    </SimpleForm>
  </Edit>
);

export const RuleCreate = (props: RuleInput) => (
  <Create {...props}>
    <SimpleForm>
      <TextInput source="merchantId" validate={[required()]} fullWidth />
      <TextInput source="partnerId" validate={[required()]} fullWidth />
      <RadioButtonGroupInput
        label="Rule type"
        source="event.type"
        choices={RULE_TYPES}
        validate={[required()]}
      />
      <TextInput source="rule.fact" validate={[required()]} />
      <SelectInput source="rule.operator" choices={OPERATORS} />
      <TextInput source="rule.value" validate={[required()]} />
      <AutoNameField />
    </SimpleForm>
  </Create>
);
