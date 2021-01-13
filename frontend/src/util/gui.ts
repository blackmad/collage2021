import * as _ from 'lodash';
import * as DAT from 'dat.gui';
export const gui = new DAT.GUI();
const typeDetectConvert = require('string-to-type');

type ChangeFunction = (value?: any) => void;

const params: Record<string, any> = {};

const originalGUIAdd = _.bind(gui.add, gui);
gui.add = addGUIParam;

const initialParams = new URLSearchParams(window.location.hash.substring(1));

export function addGUIParam(
  target: Object,
  propName: string,
  ...items: any
): DAT.GUIController {
  const controller = originalGUIAdd(target, propName, ...items);

  if (initialParams.get(propName)) {
    (target as any)[propName] = typeDetectConvert(initialParams.get(propName));
    console.log(
      `initial set to ${propName} ${typeDetectConvert(
        initialParams.get(propName)
      )}`
    );
  }

  let userOnChange: ChangeFunction;

  controller.onChange((value: any) => {
    console.log(gui.getSaveObject());
    console.log(`${propName} = ${value}`);
    params[propName] = value;

    window.location.hash = new URLSearchParams(
      _.mapValues(params, (a) => a.toString())
    ).toString();

    if (userOnChange) {
      userOnChange(value);
    }
  });

  controller.onChange = (fnc: ChangeFunction) => {
    userOnChange = fnc;
    return controller;
  };

  return controller;
}
