type IIndexableObject = { [key: string]: any };

//----------------------------------------------
//Presets
type IPresetValue = string | number | boolean;
type IPresetSetting = { id: string; value: IPresetValue };
type IPreset = {
  name: string;
  icon?: string;
  settings: IPresetSetting[];
};
type IPresetDivider = {
  divider: true;
};

//----------------------------------------------
//Lighting Handles & Mappings to controls
type ILightHandleMapping = {
  left: string;
  top: string;
};
