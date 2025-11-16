// 1. 确保导入 Pinia 核心方法（解决 defineStore 未定义问题）
import { defineStore } from 'pinia'
// 2. 相对路径导入 students.json（根据实际文件位置调整，此处默认 src/assets/data/ 目录）
import rawStudents from '../assets/data/students.json'

/**
 * 初始化数据：给原始学生数据补全 score/probability/duration/other 字段
 * @returns {Array} 处理后的完整班级数据
 */
const initData = () => {
    try {
        const processedData = rawStudents.map((cls, clsIndex) => ({
            "class-name": cls["class-name"],
            groups: cls.groups.map((group, groupIndex) => ({
                "group-id": group["group-id"],
                other: 0, // 初始化小组其他加分
                students: group.students.map((name, studentIndex) => ({
                    name,
                    score: 0, // 初始分数
                    probability: 1, // 初始抽取概率
                    duration: 0 // 初始概率持续时间
                }))
            }))
        }))
        console.log('[数据初始化] 成功！处理后班级数量：', processedData.length)
        console.log('[数据初始化] 完整数据预览：', processedData)
        return processedData
    } catch (error) {
        console.error('[数据初始化] 失败！原因：', error.message)
        return [] // 兜底：初始化失败返回空数组，避免后续报错
    }
}

// 3. 定义并导出 Pinia Store
export const useMainStore = defineStore('main', {
    state: () => ({
        allClasses: initData(), // 所有班级的完整数据（初始化后的值）
        currentClass: null, // 当前选中的班级（null 表示未选）
        drawHistory: [], // 抽取历史记录（格式：[{name, groupId, time}]）
        showEdit: false, // 编辑页显示状态（true 显示 / false 隐藏）
        showStatistics: false, // 统计页显示状态（true 显示 / false 隐藏）
        currentDrawResult: null, // 当前抽中学生的完整信息（含 groupId/name 等）
        adjustmentPopup: {
            show: false, // 必须初始化，默认不显示
            type: '',    // 初始化为空字符串
            message: '',  // 初始化为空字符串
        }
    }),
    actions: {
        /**
         * 选择班级
         * @param {string} className - 要选中的班级名称（如 "8班"）
         */
        selectClass(className) {
            console.log('[班级操作] 触发选择班级：', className)
            const targetClass = this.allClasses.find(cls => cls["class-name"] === className)

            if (targetClass) {
                this.currentClass = targetClass
                console.log('[班级操作] 选择成功！当前班级：', targetClass["class-name"])
            } else {
                this.currentClass = null
                console.warn('[班级操作] 选择失败！未找到班级：', className)
            }
        },

        /**
         * 控制编辑页显示/隐藏
         * @param {boolean} show - true 显示，false 隐藏
         */
        setShowEdit(show) {
            this.showEdit = show
            console.log('[页面控制] 编辑页状态：', show ? '显示' : '隐藏')
        },

        /**
         * 控制统计页显示/隐藏
         * @param {boolean} show - true 显示，false 隐藏
         */
        setShowStatistics(show) {
            this.showStatistics = show
            console.log('[页面控制] 统计页状态：', show ? '显示' : '隐藏')
        },

        /**
         * 核心抽取方法（根据模式计算概率并抽取学生）
         * @param {string} mode - 抽取模式（normal/group-fair/personal-fair）
         * @returns {Object|null} 抽中学生信息（失败返回 null）
         */
        drawStudent(mode) {
            if (!this.currentClass) {
                console.error('[抽取操作] 失败！未选择班级')
                return null
            }

            console.log('=====================================')
            console.log('[抽取操作] 开始！模式：', mode, '| 当前历史记录数：', this.drawHistory.length)
            console.log('[抽取操作] 当前班级：', this.currentClass["class-name"])

            // 整理当前班级学生（关联小组ID）
            const allStudents = this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    originalGroup: group
                }))
            )
            console.log('[抽取操作] 学生总数：', allStudents.length)

            // 根据模式处理概率
            let studentsWithProbability = []
            switch (mode) {
                case 'normal':
                    studentsWithProbability = this.handleNormalMode(allStudents)
                    break
                case 'fair':
                    studentsWithProbability = this.handleFairMode(allStudents)
                    break
                case 'group-fair':
                    studentsWithProbability = this.handleGroupFairMode(allStudents)
                    break
                case 'personal-fair':
                    studentsWithProbability = this.handlePersonalFairMode(allStudents)
                    break
                default:
                    console.warn('[抽取操作] 未知模式，默认使用普通模式')
                    studentsWithProbability = this.handleNormalMode(allStudents)
            }

            // 加权随机抽取
            const selectedStudent = this.weightedRandom(studentsWithProbability)

            // 记录结果
            if (selectedStudent) {
                this.currentDrawResult = selectedStudent
                const historyRecord = {
                    name: selectedStudent.name,
                    groupId: selectedStudent.groupId,
                    time: new Date().getTime()
                }
                this.drawHistory.push(historyRecord)
                console.log('[抽取操作] 抽中：', `组${selectedStudent.groupId}-${selectedStudent.name}`)
                console.log('[抽取操作] 历史记录更新后总数：', this.drawHistory.length)
            } else {
                this.currentDrawResult = null
                console.error('[抽取操作] 失败！未抽中任何学生')
            }
            console.log('=====================================')
            return selectedStudent
        },

        /**
         * 普通模式：所有学生等概率抽取
         * @param {Array} students - 学生列表
         * @returns {Array} 带最终概率的学生列表
         */
        handleNormalMode(students) {
            console.log('[模式处理] 普通模式：所有学生概率设为1（等概率）')
            const result = students.map(student => ({
                ...student,
                finalProbability: 1
            }))
            return result
        },

        /**
         * 固定概率模式：根据editpage.vue中的配置进行抽取，除持续时间外不进行概率调整
         * @param {Array} allStudents - 学生列表
         * @returns {Array} 带最终概率的学生列表
         */
        handleFairMode(allStudents) {
            console.log('[模式处理] 固定概率模式：根据个人配置进行抽取，不调整概率（持续时间除外）')

            // 步骤1：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    // 保护机制：fair模式只在修改了duration时才重置概率
                    if (student.duration > 0) {
                        student.duration -= 1
                        if (student.duration === 0 && student.probability !== 1) {
                            student.probability = 1 // 归0后重置为初始概率
                            console.log(`[Duration处理] ${student.name}：duration归0，概率重置为1`)
                        }
                    }
                })
            })

            // 步骤2：根据个人配置概率进行抽取
            const result = allStudents.map(student => ({
                ...student,
                finalProbability: student.probability // 直接使用配置概率
            }))
            return result
        },

        /**
         * 小组公平模式：仅在历史记录为10的倍数时，基于最近10次小组记录调整概率
         * 核心：直接修改原始数据确保概率持久化，非调整阶段使用最新概率
         * @param {Array} students - 临时学生列表（用于匹配原始数据）
         * @returns {Array} 带最终概率的学生列表（基于原始数据）
         */
        handleGroupFairMode(students) {
            console.log('[模式处理] 小组公平模式：开始处理')
            const historyLength = this.drawHistory.length // 当前历史总条数
            const shouldAdjustProb = historyLength > 0 && (historyLength + 1) % 10 === 0 // 10的倍数且非0

            // 步骤1：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    // 公平机制：为了防止无意篡改，始终重置duration=0时的概率
                    if (student.duration > 0) {
                        student.duration -= 1
                    }
                    if (student.duration === 0 && student.probability !== 1) {
                        student.probability = 1 // 归0后重置为初始概率
                        console.log(`[Duration处理] 组${group["group-id"]}-${student.name}：duration归0，概率重置为1`)
                    }
                })
            })

            // 步骤2：仅10的倍数时触发概率调整（修改原始数据）
            if (shouldAdjustProb) {
                console.log(`[模式处理] 小组公平模式 - 触发调整（历史数：${historyLength}，10的倍数）`)
                const recentGroupCounts = this.countRecentGroupDraws(10) // 统计最近10次小组次数

                // 收集调整信息（用于弹窗）
                const adjustedGroups = []

                // 遍历原始班级数据，直接修改原始学生对象（持久化概率）
                this.currentClass.groups.forEach(group => {
                    const groupId = group["group-id"]
                    const groupCount = recentGroupCounts[groupId] || 0

                    // 只处理需要调整的小组（次数<2或>4）
                    if (groupCount < 2 || groupCount > 4) {
                        // 遍历小组内所有学生
                        group.students.forEach(originalStudent => {
                            // 只修改持续时间>-1的学生的概率
                            if (originalStudent.duration === 0) {
                                const oldProb = originalStudent.probability // 记录调整前概率

                                // 上调：次数<2 → 概率+0.3，duration=10
                                if (groupCount < 1) {
                                    originalStudent.probability += 0.3
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}<2）`)
                                }
                                // 下调：次数>4 → 概率-0.3（最低0.1），duration=10
                                else if (groupCount > 1) {
                                    originalStudent.probability = Math.max(0.1, originalStudent.probability - 0.3)
                                    originalStudent.duration = 10
                                    console.log(`[概率调整] 组${groupId}-${originalStudent.name}：${oldProb} → ${originalStudent.probability}（次数${groupCount}>4）`)
                                }

                                // 收集调整信息（去重，每个小组只记录一次）
                                if (adjustedGroups.every(g => g.groupId !== groupId)) {
                                    adjustedGroups.push({
                                        groupId,
                                        count: groupCount,
                                        change: groupCount < 2 ? '上升' : '下降',
                                        newProb: Math.round(originalStudent.probability * 100) + '%', // 调整后的值
                                        duration: 10
                                    })
                                }
                            }
                        })
                    }
                })

                // 生成弹窗信息
                let message = '小组概率调整：\n'
                adjustedGroups.forEach((g, i) => {
                    message += `组${g.groupId}（近10次${g.count}次）：概率${g.change}至${g.newProb}，持续${g.duration}次`
                    if (i < adjustedGroups.length - 1) message += '；\n'
                })
                this.showAdjustmentPopup('group', message)
            } else {
                console.log(`[模式处理] 小组公平模式 - 不调整（历史数：${historyLength}，非10倍数）`)
            }

            // 步骤3：返回基于原始数据的最终概率（确保使用最新值）
            return this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    finalProbability: student.probability // 直接读取原始数据的当前概率
                }))
            )
        },
        /**
         * 个人公平模式：仅在历史记录为10的倍数时，基于最近10次个人记录调整概率
         * 核心：直接修改原始数据确保概率持久化，非调整阶段使用最新概率
         * @param {Array} students - 临时学生列表（用于匹配原始数据）
         * @returns {Array} 带最终概率的学生列表（基于原始数据）
         */
        handlePersonalFairMode(students) {
            console.log('[模式处理] 个人公平模式：开始处理')
            const historyLength = this.drawHistory.length // 当前历史总条数
            const shouldAdjustProb = historyLength > 0 && (historyLength + 1) % 10 === 0 // 10的倍数且非0

            // 步骤1：始终处理duration（每次抽取都递减，归0重置概率）
            this.currentClass.groups.forEach(group => {
                group.students.forEach(student => {
                    if (student.duration > 0) {
                        student.duration -= 1
                        if (student.duration === 0) {
                            student.probability = 1 // 归0后重置为初始概率
                            console.log(`[Duration处理] ${student.name}：duration归0，概率重置为1`)
                        }
                    }
                })
            })

            // 步骤2：仅10的倍数时触发概率调整（修改原始数据）
            if (shouldAdjustProb) {
                console.log(`[模式处理] 个人公平模式 - 触发调整（历史数：${historyLength}，10的倍数）`)
                const recentPersonCounts = this.countRecentPersonDraws(20) // 统计最近10次个人次数

                // 收集调整信息（用于弹窗）
                const adjustedPersons = []

                // 遍历原始班级数据，直接修改原始学生对象（持久化概率）
                this.currentClass.groups.forEach(group => {
                    group.students.forEach(originalStudent => {
                        const name = originalStudent.name
                        const personCount = recentPersonCounts[name] || 0

                        // 只处理需要调整的学生（次数<2或>4）
                        if (personCount < 2 || personCount > 4) {
                            const oldProb = originalStudent.probability // 记录调整前概率

                            // 上调：次数<2 → 概率+1，duration=10
                            if (personCount < 1) {
                                originalStudent.probability += 0.3
                                originalStudent.duration = 10
                                console.log(`[概率调整] ${name}：${oldProb} → ${originalStudent.probability}（次数${personCount}<2）`)
                            }
                            // 下调：次数>4 → 概率-0.3（最低0.1），duration=10
                            else if (personCount > 1) {
                                originalStudent.probability = Math.max(0.1, originalStudent.probability - 0.3)
                                originalStudent.duration = 10
                                console.log(`[概率调整] ${name}：${oldProb} → ${originalStudent.probability}（次数${personCount}>4）`)
                            }

                            // 收集调整信息（去重，每个学生只记录一次）
                            if (adjustedPersons.every(p => p.name !== name)) {
                                adjustedPersons.push({
                                    name,
                                    count: personCount,
                                    change: personCount < 2 ? '上升' : '下降',
                                    newProb: Math.round(originalStudent.probability * 100) + '%', // 调整后的值
                                    duration: 10
                                })
                            }
                        }
                    })
                })

                // 生成弹窗信息
                let message = '个人概率调整：\n'
                adjustedPersons.forEach((p, i) => {
                    message += `${p.name}（近10次${p.count}次）：概率${p.change}至${p.newProb}，持续${p.duration}次`
                    if (i < adjustedPersons.length - 1) message += '；\n'
                })
                this.showAdjustmentPopup('personal', message)
            } else {
                console.log(`[模式处理] 个人公平模式 - 不调整（历史数：${historyLength}，非10倍数）`)
            }

            // 步骤3：返回基于原始数据的最终概率（确保使用最新值）
            return this.currentClass.groups.flatMap(group =>
                group.students.map(student => ({
                    ...student,
                    groupId: group["group-id"],
                    finalProbability: student.probability // 直接读取原始数据的当前概率
                }))
            )
        },

        /**
         * 统计最近N次抽取的小组次数
         * @param {number} limit - 统计条数上限
         * @returns {Object} {groupId: 次数}
         */
        countRecentGroupDraws(limit) {
            const counts = {}
            const recentHistory = this.drawHistory.slice(-limit) // 取最近limit条
            recentHistory.forEach(record => {
                counts[record.groupId] = (counts[record.groupId] || 0) + 1
            })
            console.log('[统计工具] 最近', limit, '次小组次数：', counts)
            return counts
        },

        /**
         * 统计最近N次抽取的个人次数
         * @param {number} limit - 统计条数上限
         * @returns {Object} {name: 次数}
         */
        countRecentPersonDraws(limit) {
            const counts = {}
            const recentHistory = this.drawHistory.slice(-limit)
            recentHistory.forEach(record => {
                counts[record.name] = (counts[record.name] || 0) + 1
            })
            console.log('[统计工具] 最近', limit, '次个人次数：', counts)
            return counts
        },

        /**
         * 加权随机算法：根据finalProbability抽取学生
         * @param {Array} students - 带finalProbability的学生列表
         * @returns {Object|null} 抽中学生
         */
        weightedRandom(students) {
            // 计算总概率（过滤负概率）
            const totalProbability = students.reduce((sum, s) => {
                const validProb = Math.max(0, s.finalProbability)
                return sum + validProb
            }, 0)

            if (totalProbability <= 0) {
                console.error('[随机算法] 总概率为0，无法抽取')
                return null
            }

            const randomValue = Math.random() * totalProbability
            console.log('[随机算法] 总概率：', totalProbability, '| 随机数：', randomValue)

            // 查找随机数所在区间
            let currentSum = 0
            for (const student of students) {
                const validProb = Math.max(0, student.finalProbability)
                currentSum += validProb
                if (randomValue <= currentSum) {
                    console.log('[随机算法] 抽中区间：', `[${currentSum - validProb}, ${currentSum}]`)
                    return student
                }
            }

            // 兜底（理论上不会触发）
            console.warn('[随机算法] 未匹配区间，返回第一个学生')
            return students[0] || null
        },
        showAdjustmentPopup(type, message) {
            this.adjustmentPopup = {show: true, type, message};
            // 2秒后触发消失逻辑
            setTimeout(() => {
                this.adjustmentPopup.show = false; // 直接关闭（触发消失动画）
            }, 2000);
        }
    }
})