export interface HealthProviderOption {
  id: string;
  hospital: string;
  doctor: string;
  specialty: string;
  address: string;
}

export const HEALTH_PROVIDER_OPTIONS: HealthProviderOption[] = [
  {
    id: 'chaoyang-1',
    hospital: '朝阳宠物医院',
    doctor: '张明兽医师',
    specialty: '疫苗与年度体检',
    address: '朝阳区示范路 88 号',
  },
  {
    id: 'chaoyang-2',
    hospital: '安心宠物门诊',
    doctor: '李倩兽医师',
    specialty: '犬猫常规诊疗',
    address: '朝阳区建国路 120 号',
  },
  {
    id: 'haidian-1',
    hospital: '海淀宠康中心',
    doctor: '王晨兽医师',
    specialty: '驱虫与皮肤护理',
    address: '海淀区学院路 36 号',
  },
  {
    id: 'pudong-1',
    hospital: '浦东宠爱医院',
    doctor: '陈琳兽医师',
    specialty: '疫苗接种与幼宠保健',
    address: '浦东新区张杨路 560 号',
  },
  {
    id: 'tianhe-1',
    hospital: '天河爱宠诊疗中心',
    doctor: '黄泽兽医师',
    specialty: '体检与营养建议',
    address: '天河区体育西路 218 号',
  },
  {
    id: 'futian-1',
    hospital: '福田宠物健康站',
    doctor: '周妍兽医师',
    specialty: '常规体检与预防接种',
    address: '福田区福华路 66 号',
  },
];
