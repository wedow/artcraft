import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { faChevronDown } from "@fortawesome/pro-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { uiAccess, uiAccessType } from "~/signals/uiAccess";

import { Input, Button, LoadingBarStatus } from "~/components/ui";

export const ContextualLoadingBarForm = () => {
  const loadingBar = uiAccess.loadingBar;
  type LoadingBarPropsType = Omit<uiAccessType["loadingBar"], "isShowing">;
  const [loadingBarProps, setLoadingBarProps] = useState<LoadingBarPropsType>({
    status: LoadingBarStatus.IDLE,
    progress: 0,
    position: {
      x: 0,
      y: 0,
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <label className="font-bold">Loading Bar Props</label>
      <div className="flex items-center gap-2">
        <label>X:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="X"
          value={loadingBarProps.position.x}
          onChange={(e) => {
            setLoadingBarProps((curr: LoadingBarPropsType) => ({
              ...curr,
              position: {
                ...curr.position,
                x: parseInt(e.target.value) || 0,
              },
            }));
          }}
        />
        <label>Y:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="Y"
          value={loadingBarProps.position.y}
          onChange={(e) => {
            setLoadingBarProps((curr: LoadingBarPropsType) => ({
              ...curr,
              position: {
                ...curr.position,
                y: parseInt(e.target.value) || 0,
              },
            }));
          }}
        />
        <label>Width:</label>
        <Input
          className="w-20"
          type="text"
          placeholder="Width"
          value={loadingBarProps.width}
          onChange={(e) => {
            setLoadingBarProps((curr: LoadingBarPropsType) => ({
              ...curr,
              width: parseInt(e.target.value) || undefined,
            }));
          }}
        />
        <label>Progress:</label>
        <Input
          className="w-20"
          type="number"
          min={0}
          max={100}
          placeholder="%"
          value={loadingBarProps.progress}
          onChange={(e) => {
            setLoadingBarProps((curr: LoadingBarPropsType) => ({
              ...curr,
              progress: parseInt(e.target.value) || 0,
            }));
          }}
        />
      </div>
      <div className="flex items-center gap-2">
        <label>Message:</label>
        <Input
          className="w-72"
          type="text"
          placeholder="Message"
          value={loadingBarProps.message}
          onChange={(e) => {
            setLoadingBarProps((curr: LoadingBarPropsType) => ({
              ...curr,
              message: e.target.value || undefined,
            }));
          }}
        />
        <label>Status:</label>
        <Menu>
          <MenuButton>
            <div className="flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2">
              <label className="cursor-pointer">{loadingBarProps.status}</label>
              <FontAwesomeIcon icon={faChevronDown} />
            </div>
          </MenuButton>
          <MenuItems anchor="bottom">
            {Object.values(LoadingBarStatus).map((status, idx) => {
              return (
                <MenuItem key={idx}>
                  <div
                    className="block cursor-pointer data-[focus]:bg-primary-100"
                    onClick={() => {
                      setLoadingBarProps((curr: LoadingBarPropsType) => ({
                        ...curr,
                        status: status,
                      }));
                    }}
                  >
                    {status}
                  </div>
                </MenuItem>
              );
            })}
          </MenuItems>
        </Menu>
      </div>

      <div className="flex gap-2">
        <Button onClick={() => loadingBar.show(loadingBarProps)}>Show</Button>
        <Button onClick={() => loadingBar.update(loadingBarProps)}>
          Update
        </Button>
        <Button onClick={() => loadingBar.hide()}>Hide</Button>
      </div>
    </div>
  );
};
