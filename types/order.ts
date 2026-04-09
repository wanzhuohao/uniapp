export interface ParentDate {
  year: string;
  month: string;
  day: string;
}

export interface ParentInfo {
  name: string;
  birth: ParentDate;
  death: ParentDate;
}

/** 碑文表单数据（与 stele-utils.ts 中 SteleForm 一致） */
export interface OrderForm {
  selected: string; // '0'=双人 '1'=父 '2'=母
  father: ParentInfo;
  mother: ParentInfo;
  bigTitle: string;
  dateQingming: boolean;
  dateShowLunar: boolean;
  libei: string[]; // [年, 月, 日]
  names: string[][][]; // [行][列][称谓, 姓名]
  user: string;
  remark: string; // 备注（地址、碑型、价格等）
}

/** 碑文预览数据 */
export interface PreviewData {
  title: string;
  big: string;
  small: string;
  date: string;
  birth: string;
}

/** 订单保存 payload */
export interface SavePayload {
  id?: string;
  big: string;
  title: string;
  small: string;
  birth: string;
  date: string;
  time: number;
  info: Omit<OrderForm, 'user' | 'remark'>;
  user: string;
  remark: string;
}

/** 订单列表项 */
export interface OrderItem {
  _id: string;
  user: string;
  time: number;
  big: string;
  title: string;
  small: string;
  birth: string;
  date: string;
  info: Omit<OrderForm, 'user' | 'remark'>;
  remark: string;
}
