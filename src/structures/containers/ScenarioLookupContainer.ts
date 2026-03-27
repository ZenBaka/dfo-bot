import { ContainerBuilder } from 'discord.js';
import { type IScenarioJSON } from '../../interfaces/IScenarioJSON';

export default class ScenarioLookupContainer {
  private data: IScenarioJSON;

  constructor(data: IScenarioJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent('## Scenario Viewer'),
      (textDisplay) => textDisplay.setContent(this.data.description),
      (textDisplay) => textDisplay.setContent(
        `-# **ID:** \`${this.data.id}\` | **Created By:** \`${this.data.createdBy}\``
      ),
      (textDisplay) => textDisplay.setContent(
        `-# **Created On:** \`${new Date(this.data.createdOn).toDateString()}\` | **Last Updated:** \`${new Date(this.data.lastUpdated).toDateString()}\``
      )
    );

    container.addSeparatorComponents((s) => s);

    container.addTextDisplayComponents((textDisplay) => textDisplay.setContent('-# ⚔️ DFO Cross-Platform Integration')
    );

    return container;
  }
}
