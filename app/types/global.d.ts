
interface IElectronAPI {
  loadPreferences: () => Promise<void>
}

interface Window {
  version: string
  electronAPI: IElectronAPI
  // Hack to avoid certain circular imports that are difficult to resolve.
  // Importing some classes results in circular dependencies that seem intractible.
  // Moving the classes to window allows instantiating and checking instanceof without
  // direct imports.
  AstralProjection: AstralProjectionClass
  Clone: CloneClass
  Enemy: EnemyClass
  Hero: HeroClass
  ScriptScene: ScriptSceneClass
  [key: string]: any
}

type Collection<T> = {[key:string]: T} | Array<T> | Set<T>;

type Color = string;
// type Range = [number, number];

type Tags = {[key: string]: true};

interface Renderable {
    render(context: CanvasRenderingContext2D, target: Rect): void
}
