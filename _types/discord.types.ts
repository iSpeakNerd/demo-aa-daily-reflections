import { removeLineBreaks } from '../utils/strings.ts';
import { wrapErrorWithContext, ErrorType } from '../utils/errors.ts';

export {
  type FieldEmbed,
  type DiscordEmbed,
  createDiscordEmbed,
  DiscordCommand,
};

type FieldEmbed = {
  name: string; // Required
  value: string; // Required
  inline?: boolean;
};

type DiscordEmbed = {
  description?: string;
  color?: number;
  title?: string;
  url?: string;
  author?: {
    name?: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: {
    url: string;
  };
  fields?: FieldEmbed[]; // Optional array, but if provided, each item must have name and value
  image?: {
    url: string;
  };
  timestamp?: string;
  footer?: {
    text?: string;
    icon_url?: string;
  };
};

type DiscordCommand = {
  name: string;
  description: string;
};

/**
 * Removes line breaks \n\r from the string fields of the discord embed
 * @param embed - The discord embed to process string fields of
 * @returns The discord embed with processed string fields
 */
async function createDiscordEmbed(embed: DiscordEmbed): Promise<DiscordEmbed> {
  try {
    if (!embed.fields) {
      return embed;
    }
    const processedFields = embed.fields?.map(async (field) => ({
      ...field,
      name: await removeLineBreaks(field.name),
      value: await removeLineBreaks(field.value),
    }));

    return {
      ...embed,
      fields: await Promise.all(processedFields),
    };
  } catch (error) {
    throw wrapErrorWithContext(error, ErrorType.INTERNAL);
  }
}
