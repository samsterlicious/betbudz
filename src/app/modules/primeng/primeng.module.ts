import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AccordionModule } from 'primeng/accordion';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { SidebarModule } from 'primeng/sidebar';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';

const primeNgModules = [
  AccordionModule,
  BreadcrumbModule,
  ButtonModule,
  CardModule,
  ConfirmDialogModule,
  ChipModule,
  DropdownModule,
  InputNumberModule,
  InputTextModule,
  MenubarModule,
  MessageModule,
  MessagesModule,
  MenuModule,
  ProgressSpinnerModule,
  RippleModule,
  SidebarModule,
  TabViewModule,
  TableModule,
  ToastModule,
  ToolbarModule,
];

@NgModule({
  imports: [primeNgModules, BrowserAnimationsModule],
  exports: [primeNgModules],
})
export class PrimengModule {}
