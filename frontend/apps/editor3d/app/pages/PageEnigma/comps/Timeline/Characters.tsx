import { characterGroup } from "~/pages/PageEnigma/signals";
import { Character } from "~/pages/PageEnigma/comps/Timeline/Character";
import { useSignals } from "@preact/signals-react/runtime";

export const Characters = () => {
  useSignals();
  return (
    <>
      {characterGroup.value.characters.map((character) => (
        <div key={character.object_uuid} className="mb-1 pr-4">
          <Character character={character} />
        </div>
      ))}
    </>
  );
};
