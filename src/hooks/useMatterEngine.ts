import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

export const useMatterEngine = (
  containerRef: React.RefObject<HTMLDivElement | null>
) => {
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Setup Matter.js Engine
    const engine = Matter.Engine.create();
    const world = engine.world;
    engineRef.current = engine;

    // 2. Setup Render (We need this for MouseConstraint to work easily,
    //    even if we don't draw sprites on it. We can make it transparent on top/behind)
    const render = Matter.Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        background: 'transparent',
        wireframes: false, // Set to true for debugging physics
        showAngleIndicator: false,
      },
    });

    // Make canvas transparent and pointer-events-none if we want to click through
    // BUT we want MouseConstraint, so we need pointer events.
    // We will handle styling in CSS.
    renderRef.current = render;

    // 3. Create Walls & Floor
    const wallOptions = {
      isStatic: true,
      render: { visible: false }, // Invisible walls
    };

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const wallThickness = 60;

    const floor = Matter.Bodies.rectangle(
      width / 2,
      height + wallThickness / 2,
      width,
      wallThickness,
      wallOptions
    );
    const ceiling = Matter.Bodies.rectangle(
      width / 2,
      -wallThickness * 2, // Put ceiling way up so bubbles fall in
      width,
      wallThickness,
      wallOptions
    );
    const leftWall = Matter.Bodies.rectangle(
      0 - wallThickness / 2,
      height / 2,
      wallThickness,
      height * 2,
      wallOptions
    );
    const rightWall = Matter.Bodies.rectangle(
      width + wallThickness / 2,
      height / 2,
      wallThickness,
      height * 2,
      wallOptions
    );

    Matter.World.add(world, [floor, ceiling, leftWall, rightWall]);

    // 4. Mouse Control
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false,
        },
      },
    });

    Matter.World.add(world, mouseConstraint);

    // Keep the mouse in sync with rendering
    render.mouse = mouse;

    // 5. Runner
    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // setIsReady(true); // Don't trigger re-render synchronously

    // 6. Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderRef.current) return;

      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;

      // Update canvas size
      renderRef.current.bounds.max.x = newWidth;
      renderRef.current.bounds.max.y = newHeight;
      renderRef.current.options.width = newWidth;
      renderRef.current.options.height = newHeight;
      renderRef.current.canvas.width = newWidth;
      renderRef.current.canvas.height = newHeight;


      // Update Walls
      // We must recreate the vertices to resize the bodies correctly without scaling artifacts

      const updateBody = (body: Matter.Body, x: number, y: number, w: number, h: number) => {
         Matter.Body.setVertices(body, Matter.Bodies.rectangle(x, y, w, h).vertices);
         Matter.Body.setPosition(body, { x, y });
      };

      updateBody(floor, newWidth / 2, newHeight + wallThickness / 2, newWidth, wallThickness);
      updateBody(ceiling, newWidth / 2, -wallThickness * 2, newWidth, wallThickness);
      updateBody(leftWall, 0 - wallThickness / 2, newHeight / 2, wallThickness, newHeight * 2);
      updateBody(rightWall, newWidth + wallThickness / 2, newHeight / 2, wallThickness, newHeight * 2);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
      if (render.canvas) {
        render.canvas.remove();
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (render as any).canvas = null;
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (render as any).context = null;
      render.textures = {};
    };
  }, [containerRef]);

  // Use a timeout or ensure effect runs after paint to avoid synchronous updates?
  // Actually, since engineRef is a ref, it persists.
  // We want to signal the component that the engine is ready.
  // We can use a useLayoutEffect or just setState (which is fine in useEffect usually).
  // The linter is strict about cascading renders.
  // But here we only set it once.

  useEffect(() => {
     if (engineRef.current) {
        // Defer state update to avoid strict mode warning or just accept it's necessary for initialization
        const timer = setTimeout(() => setIsReady(true), 0);
        return () => clearTimeout(timer);
     }
  }, []);

  return { engineRef, isReady };
};
