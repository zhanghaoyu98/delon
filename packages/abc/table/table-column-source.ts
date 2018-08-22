import { Injectable, Optional, Inject, Host } from '@angular/core';
import { ACLService } from '@delon/acl';
import { ALAIN_I18N_TOKEN, AlainI18NService } from '@delon/theme';
import { deepCopy } from '@delon/util';

import { NaTableColumn, NaTableButton } from './interface';
import { NaTableRowSource } from './table-row.directive';
import { NaTableConfig } from './table.config';

export interface NaTableSortMap {
  /** 是否启用排序 */
  enabled: boolean;
  /** 当前排序值：`ascend`、`descend` */
  v?: 'ascend' | 'descend';
  /** 排序的后端相对应的KEY */
  key?: string;
  /** 对应列描述 */
  column?: NaTableColumn;
}

@Injectable()
export class NaTableColumnSource {
  constructor(
    @Host() private rowSource: NaTableRowSource,
    @Optional() private acl: ACLService,
    @Optional()
    @Inject(ALAIN_I18N_TOKEN)
    private i18nSrv: AlainI18NService,
    private cog: NaTableConfig,
  ) {}

  private btnCoerce(list: NaTableButton[]): NaTableButton[] {
    if (!list) return [];
    const ret: NaTableButton[] = [];
    for (const item of list) {
      if (this.acl && item.acl && !this.acl.can(item.acl)) continue;

      if (item.type === 'del' && typeof item.pop === 'undefined')
        item.pop = true;

      if (item.pop === true) {
        item._type = 2;
        if (typeof item.popTitle === 'undefined')
          item.popTitle = `确认删除吗？`;
      }
      if (item.children && item.children.length > 0) {
        item._type = 3;
        item.children = this.btnCoerce(item.children);
      }
      if (!item._type) item._type = 1;

      // i18n
      if (item.i18n && this.i18nSrv) item.text = this.i18nSrv.fanyi(item.i18n);

      ret.push(item);
    }
    this.btnCoerceIf(ret);
    return ret;
  }

  private btnCoerceIf(list: NaTableButton[]) {
    for (const item of list) {
      if (!item.iif) item.iif = () => true;
      if (!item.children) {
        item.children = [];
      } else {
        this.btnCoerceIf(item.children);
      }
    }
  }

  private fixedCoerce(list: NaTableColumn[]) {
    const countReduce = (a: number, b: NaTableColumn) =>
      a + +b.width.toString().replace('px', '');
    // left width
    list
      .filter(w => w.fixed && w.fixed === 'left' && w.width)
      .forEach(
        (item, idx) =>
          (item._left = list.slice(0, idx).reduce(countReduce, 0) + 'px'),
      );
    // right width
    list
      .filter(w => w.fixed && w.fixed === 'right' && w.width)
      .reverse()
      .forEach(
        (item, idx) =>
          (item._right =
            (idx > 0 ? list.slice(-idx).reduce(countReduce, 0) : 0) + 'px'),
      );
  }

  process(
    list: NaTableColumn[],
  ): { columns: NaTableColumn[]; sortMap: { [key: number]: NaTableSortMap } } {
    if (!list || list.length === 0)
      throw new Error(`[na-table]: the columns property muse be define!`);

    let checkboxCount = 0;
    let radioCount = 0;
    const sortMap: { [key: number]: NaTableSortMap } = {};
    let idx = 0;
    const columns: NaTableColumn[] = [];
    const copyColumens = deepCopy(list) as NaTableColumn[];
    for (const item of copyColumens) {
      if (this.acl && item.acl && !this.acl.can(item.acl)) continue;
      if (item.index) {
        if (!Array.isArray(item.index)) item.index = item.index.split('.');

        item.indexKey = item.index.join('.');
      }
      // rowSelection
      if (!item.selections) item.selections = [];
      if (item.type === 'checkbox') {
        ++checkboxCount;
        if (!item.width) {
          item.width = `${item.selections.length > 0 ? 60 : 50}px`;
        }
      }
      if (item.type === 'radio') {
        ++radioCount;
        item.selections = [];
        if (!item.width) item.width = '50px';
      }
      if (item.type === 'yn' && typeof item.ynTruth === 'undefined') {
        item.ynTruth = true;
      }
      if (
        (item.type === 'link' && typeof item.click !== 'function') ||
        (item.type === 'badge' && typeof item.badge === 'undefined') ||
        (item.type === 'tag' && typeof item.tag === 'undefined')
      ) {
        (item as any).type = '';
      }
      if (!item.className) {
        item.className = {
          // 'checkbox': 'text-center',
          // 'radio': 'text-center',
          number: 'text-right',
          currency: 'text-right',
          date: 'text-center',
        }[item.type];
      }

      // sorter
      if (item.sorter && typeof item.sorter === 'function') {
        sortMap[idx] = {
          enabled: true,
          v: item.sort,
          key: item.sortKey || item.indexKey,
          column: item,
        };
      } else {
        sortMap[idx] = {
          enabled: false,
        };
      }
      // filter
      if (!item.filter || !item.filters) item.filters = [];
      if (typeof item.filterMultiple === 'undefined')
        item.filterMultiple = true;
      if (!item.filterConfirmText)
        item.filterConfirmText = this.cog.filterConfirmText;
      if (!item.filterClearText)
        item.filterClearText = this.cog.filterClearText;
      if (!item.filterIcon) item.filterIcon = `anticon anticon-filter`;
      item.filtered = item.filters.findIndex(w => w.checked) !== -1;

      if (this.acl) {
        item.selections = item.selections.filter(w => this.acl.can(w.acl));
        item.filters = item.filters.filter(w => this.acl.can(w.acl));
      }

      // buttons
      item.buttons = this.btnCoerce(item.buttons);
      // i18n
      if (item.i18n && this.i18nSrv) item.title = this.i18nSrv.fanyi(item.i18n);
      // restore custom row
      if (item.render) {
        item.__renderTitle = this.rowSource.getTitle(item.render);
        item.__render = this.rowSource.getRow(item.render);
      }

      ++idx;
      columns.push(item);
    }
    if (checkboxCount > 1)
      throw new Error(`[na-table]: just only one column checkbox`);
    if (radioCount > 1)
      throw new Error(`[na-table]: just only one column radio`);

    this.fixedCoerce(columns);

    return { columns, sortMap };
  }
}
