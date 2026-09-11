import App from './App'
import { createSSRApp } from 'vue'
import {
  ElButton, ElCheckbox, ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElForm, ElFormItem, ElInput, ElOption, ElPagination, ElRadio, ElRadioButton,
  ElRadioGroup, ElSelect, ElSplitter, ElSplitterPanel, ElSwitch, ElTable, ElTableColumn,
} from 'element-plus'
import 'element-plus/es/components/button/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/dialog/style/css'
import 'element-plus/es/components/dropdown/style/css'
import 'element-plus/es/components/dropdown-item/style/css'
import 'element-plus/es/components/dropdown-menu/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/pagination/style/css'
import 'element-plus/es/components/radio/style/css'
import 'element-plus/es/components/radio-button/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/splitter/style/css'
import 'element-plus/es/components/splitter-panel/style/css'
import 'element-plus/es/components/switch/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const elementComponents = [
  ElButton, ElCheckbox, ElDialog, ElDropdown, ElDropdownItem, ElDropdownMenu,
  ElForm, ElFormItem, ElInput, ElOption, ElPagination, ElRadio, ElRadioButton,
  ElRadioGroup, ElSelect, ElSplitter, ElSplitterPanel, ElSwitch, ElTable, ElTableColumn,
]

export function createApp() {
  const app = createSSRApp(App)
  for (const component of elementComponents) app.component(component.name, component)
  return { app }
}
