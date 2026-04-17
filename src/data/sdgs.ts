import type { SDG } from '../types';

export const SDG_DATA: SDG[] = [
  {
    number: 1,
    name: 'No Poverty',
    shortDescription: 'End poverty in all its forms everywhere',
    icon: 'sdg-1.svg',
    color: '#E5243B',
  },
  {
    number: 2,
    name: 'Zero Hunger',
    shortDescription: 'End hunger, achieve food security and improved nutrition',
    icon: 'sdg-2.svg',
    color: '#DDA63A',
  },
  {
    number: 3,
    name: 'Good Health and Well-Being',
    shortDescription: 'Ensure healthy lives and promote well-being for all',
    icon: 'sdg-3.svg',
    color: '#4C9F38',
  },
  {
    number: 4,
    name: 'Quality Education',
    shortDescription: 'Ensure inclusive and equitable quality education',
    icon: 'sdg-4.svg',
    color: '#C5192D',
  },
  {
    number: 5,
    name: 'Gender Equality',
    shortDescription: 'Achieve gender equality and empower all women and girls',
    icon: 'sdg-5.svg',
    color: '#FF3A21',
  },
  {
    number: 6,
    name: 'Clean Water and Sanitation',
    shortDescription: 'Ensure availability and sustainable management of water',
    icon: 'sdg-6.svg',
    color: '#26BDE2',
  },
  {
    number: 7,
    name: 'Affordable and Clean Energy',
    shortDescription: 'Ensure access to affordable, reliable, sustainable energy',
    icon: 'sdg-7.svg',
    color: '#FCC30B',
  },
  {
    number: 8,
    name: 'Decent Work and Economic Growth',
    shortDescription: 'Promote sustained, inclusive and sustainable economic growth',
    icon: 'sdg-8.svg',
    color: '#A21942',
  },
  {
    number: 9,
    name: 'Industry, Innovation and Infrastructure',
    shortDescription: 'Build resilient infrastructure, promote innovation',
    icon: 'sdg-9.svg',
    color: '#FD6925',
  },
  {
    number: 10,
    name: 'Reduced Inequalities',
    shortDescription: 'Reduce inequality within and among countries',
    icon: 'sdg-10.svg',
    color: '#DD1367',
  },
  {
    number: 11,
    name: 'Sustainable Cities and Communities',
    shortDescription: 'Make cities inclusive, safe, resilient and sustainable',
    icon: 'sdg-11.svg',
    color: '#FD9D24',
  },
  {
    number: 12,
    name: 'Responsible Consumption and Production',
    shortDescription: 'Ensure sustainable consumption and production patterns',
    icon: 'sdg-12.svg',
    color: '#BF8B2E',
  },
  {
    number: 13,
    name: 'Climate Action',
    shortDescription: 'Take urgent action to combat climate change',
    icon: 'sdg-13.svg',
    color: '#3F7E44',
  },
  {
    number: 14,
    name: 'Life Below Water',
    shortDescription: 'Conserve and sustainably use the oceans and marine resources',
    icon: 'sdg-14.svg',
    color: '#0A97D9',
  },
  {
    number: 15,
    name: 'Life on Land',
    shortDescription: 'Protect, restore and promote sustainable use of ecosystems',
    icon: 'sdg-15.svg',
    color: '#56C02B',
  },
  {
    number: 16,
    name: 'Peace, Justice and Strong Institutions',
    shortDescription: 'Promote peaceful and inclusive societies for sustainable development',
    icon: 'sdg-16.svg',
    color: '#00689D',
  },
  {
    number: 17,
    name: 'Partnerships for the Goals',
    shortDescription: 'Strengthen the means of implementation and revitalize partnerships',
    icon: 'sdg-17.svg',
    color: '#19486A',
  },
];

export function getSDG(num: number): SDG | undefined {
  return SDG_DATA.find((sdg) => sdg.number === num);
}
