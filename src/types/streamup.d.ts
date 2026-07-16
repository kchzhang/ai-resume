// Minimal type declarations for @knoxzhang/streamup.
// The published package's `types` field points to a missing file, so we
// declare the bits we use here.
declare module '@knoxzhang/streamup' {
  import type { DefineComponent, Ref } from 'vue';

  export type StreamSource = string | Ref<string> | { value: string } | undefined;

  export interface StreamProps {
    /** Markdown source: a plain string or a ref holding a string. */
    source?: StreamSource;
    /** Whether content is still being streamed (enables smooth rendering). */
    streaming?: boolean;
    /** Typing animation speed; 0 disables the animation. */
    smoothSpeed?: number | string;
    /** Auto-scroll the container to the bottom on new content. */
    autoScroll?: boolean;
    /** Enable virtual scrolling (boolean or virtualizer options). */
    virtual?: boolean | Record<string, unknown>;
    /** Custom fenced code block languages rendered by a slot/component. */
    customBlocks?: string[];
  }

  export const Stream: DefineComponent<StreamProps>;
}
