// src/utils/settingsControl.ts
import settingsJson from '../assets/data/settings.json'

// 定义设置项类型接口
interface SettingItem {
    name: string
    'set-type': 'number' | 'boolean'
    default: number | boolean
}

// 定义完整设置对象类型
type SettingsObject = Record<string, number | boolean>

// 过滤并处理配置项（忽略第一个type为"settings"的项）
const validSettings: SettingItem[] = (settingsJson as any[]).filter(
    (item, index) => index !== 0 && item.name && item['set-type'] && 'default' in item
)

// 初始化本地存储（确保所有设置都有默认值，存储在mmy_settings键中）
const initLocalStorage = () => {
    const storedSettings = localStorage.getItem('mmy_settings')
    const initialSettings: SettingsObject = {}

    // 构建初始设置对象
    validSettings.forEach(setting => {
        initialSettings[setting.name] = setting.default
    })

    // 如果不存在则初始化
    if (storedSettings === null) {
        localStorage.setItem('mmy_settings', JSON.stringify(initialSettings))
    } else {
        // 合并已有设置和新设置（确保新增的设置项有默认值）
        const existingSettings = JSON.parse(storedSettings) as SettingsObject
        const mergedSettings = { ...initialSettings, ...existingSettings }
        localStorage.setItem('mmy_settings', JSON.stringify(mergedSettings))
    }
}

// 从本地存储获取设置（自动转换类型）
// 无参数时返回完整设置字段，有参数时返回指定设置
const getSetting = <T extends number | boolean>(name?: string): T | SettingsObject => {
    // 先进行初始化
    initLocalStorage()

    // 获取完整设置对象
    const storedSettings = localStorage.getItem('mmy_settings')
    const settings = storedSettings ? JSON.parse(storedSettings) as SettingsObject : {}

    if (!name) {
        // 返回完整设置字段
        return settings
    }

    // 检查设置是否存在
    const setting = validSettings.find(item => item.name === name)
    if (!setting) {
        throw new Error(`Setting ${name} not found in settings.json`)
    }

    // 确保返回正确的类型
    const value = settings[name] ?? setting.default
    switch (setting['set-type']) {
        case 'number':
            return Number(value) as T
        case 'boolean':
            return Boolean(value) as T
        default:
            return value as T
    }
}

// 保存设置到本地存储
const saveSetting = (name: string, value: number | boolean) => {
    // 先进行初始化
    initLocalStorage()

    // 检查设置是否存在
    const setting = validSettings.find(item => item.name === name)
    if (!setting) {
        throw new Error(`Setting ${name} not found in settings.json`)
    }

    // 验证值类型
    if (
        (setting['set-type'] === 'number' && typeof value !== 'number') ||
        (setting['set-type'] === 'boolean' && typeof value !== 'boolean')
    ) {
        throw new Error(`Invalid type for setting ${name}, expected ${setting['set-type']}`)
    }

    // 获取当前设置并更新
    const storedSettings = localStorage.getItem('mmy_settings')
    const settings = storedSettings ? JSON.parse(storedSettings) as SettingsObject : {}
    settings[name] = value

    // 保存完整设置对象
    localStorage.setItem('mmy_settings', JSON.stringify(settings))
}

export { getSetting, saveSetting, validSettings }