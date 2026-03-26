import type {ScaffoldConfig} from '../../types/scaffold';

export function render(config: ScaffoldConfig): string {
	const {pluginName, pluginClassName} = config;

	return `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ${pluginClassName}Module } from '../../projects/${pluginName}/src/public-api';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule, ${pluginClassName}Module],
  bootstrap: [AppComponent],
})
export class AppModule {}
`;
}
