import { useState } from "react";
import { Input, Button } from "~/components/ui";

import { uiAccess } from "~/signals/uiAccess";

export const DialogErrorForm = () => {
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold">Error Dialog Props</label>
      <div className="flex items-center gap-2">
        <label>Title</label>
        <Input
          className="w-40"
          type="text"
          placeholder="Message"
          value={title ?? ""}
          onChange={(e) => {
            const value = e.target.value === "" ? undefined : e.target.value;
            setTitle(value);
          }}
        />
        <label>Message</label>
        <Input
          className="w-72"
          type="text"
          placeholder="Message"
          value={message ?? ""}
          onChange={(e) => {
            const value = e.target.value === "" ? undefined : e.target.value;
            setMessage(value);
          }}
        />
        <Button
          onClick={() => {
            uiAccess.dialogueError.show({
              title: title,
              message: message,
            });
          }}
        >
          Show
        </Button>
        <Button
          onClick={() => {
            uiAccess.dialogueError.hide();
          }}
        >
          Hide
        </Button>
      </div>
    </div>
  );
};
