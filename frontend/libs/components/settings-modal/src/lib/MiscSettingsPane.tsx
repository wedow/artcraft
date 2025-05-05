import { useState } from "react";

interface MiscSettingsPaneProps {
  test?: string;
}

export const MiscSettingsPane = (args: MiscSettingsPaneProps) => {
  return (<>
    <div>
      <button className="text-blue-600">Other Settings and such...</button>
    </div>
    <h1>Test</h1>
    <p>Foo Bar Baz</p>
  </>)
}
