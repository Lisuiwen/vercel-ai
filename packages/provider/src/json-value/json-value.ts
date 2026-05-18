/**
 * JSON 值可以是字符串、数字、布尔值、对象、数组或 null。
 * JSON 值可以通过 JSON.stringify 和 JSON.parse 方法进行序列化和反序列化。
 */
export type JSONValue =
  | null
  | string
  | number
  | boolean
  | JSONObject
  | JSONArray;

export type JSONObject = {
  [key: string]: JSONValue | undefined;
};

export type JSONArray = JSONValue[];
