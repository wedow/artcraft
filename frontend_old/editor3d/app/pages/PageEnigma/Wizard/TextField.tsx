import { Input } from "~/components";
import { textInput } from "~/pages/PageEnigma/Wizard/signals/wizard";

export const TextField = () => {
  return (
    <div>
      <Input
        value={textInput.value}
        onChange={(event) => (textInput.value = event.target.value)}
      />
    </div>
  );
};
