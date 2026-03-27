import { ContainerBuilder } from 'discord.js';
import { type INPCJSON } from '../../interfaces/INPCJSON';

export default class NPCLookupContainer {
  private data: INPCJSON;

  constructor(data: INPCJSON) {
    this.data = data;
  }

  public build(): ContainerBuilder {
    const container = new ContainerBuilder();

    container.addTextDisplayComponents(
      (textDisplay) => textDisplay.setContent(`## 💀 (ID: ${this.data.id}) ${this.data.name}`),
      (textDisplay) => textDisplay.setContent(this.data.description)
    );

    return container;
  }
}
