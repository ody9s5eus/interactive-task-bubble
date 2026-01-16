import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { AnimatePresence } from 'framer-motion';
import { useMatterEngine } from '../hooks/useMatterEngine';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Bubble } from './Bubble';
import { InputOverlay } from './InputOverlay';
import { TrashZone } from './TrashZone';
import type { Task } from '../types';
import { getRandomColor } from '../utils/colors';

const BUBBLE_DENSITY = 0.001; // Standard density
const MIN_RADIUS = 30;
const MAX_RADIUS = 80;

export const PhysicsWorld = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const { engineRef, isReady, mouseConstraintRef } = useMatterEngine(containerRef);

  const [tasks, setTasks] = useLocalStorage<Task[]>('bubbles-tasks', []);
  const [bubbleColors, setBubbleColors] = useLocalStorage<Record<string, string>>('bubbles-colors', {});
  const [trashHovered, setTrashHovered] = useState(false);

  // Map to store body references by Task ID
  const bodiesRef = useRef<Map<string, Matter.Body>>(new Map());
  // Map to store DOM refs for syncing positions
  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Helper to calculate radius based on text length
  const calculateRadius = (text: string) => {
    const base = MIN_RADIUS;
    const factor = Math.min(text.length * 2, MAX_RADIUS - MIN_RADIUS);
    return base + factor;
  };

  // Sync React State with Matter.js World
  useEffect(() => {
    if (!isReady || !engineRef.current || !containerRef.current) return;

    const world = engineRef.current.world;
    const { width } = containerRef.current.getBoundingClientRect();

    // 1. Add new bodies for new tasks
    tasks.forEach((task) => {
      if (!bodiesRef.current.has(task.id)) {
        const radius = calculateRadius(task.text);

        // Random position for new bubbles (top of screen)
        const x = Math.random() * (width - 100) + 50;
        const y = -100; // Start above screen

        const body = Matter.Bodies.circle(x, y, radius, {
          restitution: 0.9, // Bouncy
          friction: 0.005,
          frictionAir: 0.01,
          density: BUBBLE_DENSITY,
          label: task.id, // Use label to identify body
          render: { visible: false },
        });

        Matter.World.add(world, body);
        bodiesRef.current.set(task.id, body);

        // Set color if not exists
        if (!bubbleColors[task.id]) {
          setBubbleColors(prev => ({ ...prev, [task.id]: getRandomColor() }));
        }
      }
    });

    // 2. Remove bodies for deleted tasks
    const activeIds = new Set(tasks.map(t => t.id));
    bodiesRef.current.forEach((body, id) => {
      if (!activeIds.has(id)) {
        Matter.World.remove(world, body);
        bodiesRef.current.delete(id);
        // Also cleanup color? Maybe keep it simple.
      }
    });

  }, [tasks, isReady, bubbleColors, setBubbleColors]); // Add deps

  // Animation Loop for Syncing DOM Positions
  useEffect(() => {
    if (!isReady || !engineRef.current) return;

    let animationFrameId: number;

    const loop = () => {
      bodiesRef.current.forEach((body, id) => {
        const domNode = domRefs.current.get(id);
        if (domNode) {
          const { x, y } = body.position;
          const angle = body.angle;
          // Use translate3d for GPU acceleration
          // We need to offset by radius because DOM element is top-left based,
          // but Matter.js body.position is center-based.
          // However, we set width/height in Bubble, so we can center it via CSS or offset here.
          // Actually, Bubble is `absolute` positioned.
          // Let's assume the DOM node is the box. `left: x, top: y` centers it if we use `transform: translate(-50%, -50%)` in CSS.

          domNode.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${angle}rad) translate(-50%, -50%)`;

          // Check for Trash Zone interaction during drag
          // We can check if the body is currently being held by MouseConstraint.
          // But MouseConstraint doesn't easily expose "currently held body" in a public property that changes reactively.
          // However, we can check if body position is within TrashZone bounds.
        }
      });

      // Trash Zone Detection logic
      // We need to know if the user is dragging something.
      // Matter.MouseConstraint events: 'startdrag', 'enddrag'.
      // We can hook into those.

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isReady]);

  // Handle Resize to keep bodies in bounds
  useEffect(() => {
    if (!isReady || !engineRef.current) return;

    const handleResize = () => {
      const { innerWidth } = window;
      const bodies = Array.from(bodiesRef.current.values());

      bodies.forEach((body) => {
        let { x, y } = body.position;
        let clamped = false;
        // Simple clamp
        if (x > innerWidth) {
           x = innerWidth - 50;
           clamped = true;
        }
        if (x < 0) {
            x = 50;
            clamped = true;
        }
        // y is harder because floor moves, but let's just ensure it's not super far down or up
        // Floor handles y usually, but if screen shrinks significantly, body might be "under" floor?
        // MatterJS walls update in useMatterEngine.
        // We just care if it's off-screen laterally mostly.

        if (clamped) {
           Matter.Body.setPosition(body, { x, y });
           Matter.Body.setVelocity(body, { x: 0, y: 0 }); // Kill velocity so it doesn't fly out again
        }
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isReady]);

  // Trash Zone & Mouse Events Logic
  useEffect(() => {
    if (!isReady || !engineRef.current) return;

    // Find the MouseConstraint in the world (it was added in useMatterEngine)
    // Maybe we should return it from useMatterEngine?
    // But we can also listen to events on the Engine/World if we had access to the mouse constraint instance.
    // Standard way: Matter.Events.on(mouseConstraint, ...)

    // Let's modify useMatterEngine to return the mouseConstraint or add listeners there?
    // Or we can just iterate world.constraints.
    // Let's assume the last added constraint is the mouse constraint or check 'type' if available.
    // Actually, `Matter.MouseConstraint` objects don't serve as standard constraints in the `world.constraints` array in the same way?
    // Wait, `Matter.World.add(world, mouseConstraint)` adds it to the world.
    // Let's traverse constraints.

    const mouseC = mouseConstraintRef.current;

    if (mouseC) {
      Matter.Events.on(mouseC, 'startdrag', () => {
        // Valid drag start
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Matter.Events.on(mouseC, 'enddrag', (event: any) => {
        const body = event.body;
        if (!body || !trashRef.current) return;

        // Check if body is inside Trash Zone
        const trashRect = trashRef.current.getBoundingClientRect();
        const { x, y } = body.position; // Position is relative to canvas

        if (
          x >= trashRect.left &&
          x <= trashRect.right &&
          y >= trashRect.top &&
          y <= trashRect.bottom
        ) {
          // Pop it!
          handlePop(body.label); // body.label is task.id
        }
      });

      // Handle Double Click for "Pop"
      // Since we disabled pointer events on DOM, we need to detect click on Canvas and check bodies
      // Using 'mousedown' on mouse constraint or just listening to DOM click on container

      const handleDoubleClick = (e: MouseEvent) => {
         // This is a DOM double click on the container
         // We need to query Matter.js world at this point
         // Matter.Query.point(bodies, vector)

         const { clientX, clientY } = e;
         // Assuming canvas is full screen, client coords match world coords (if no scrolling/offset)
         // Check offset
         if (!containerRef.current) return;
         const rect = containerRef.current.getBoundingClientRect();
         const x = clientX - rect.left;
         const y = clientY - rect.top;

         const bodies = Array.from(bodiesRef.current.values());
         const clickedBodies = Matter.Query.point(bodies, { x, y });

         if (clickedBodies.length > 0) {
             // Pop the first one
             const body = clickedBodies[0];
             handlePop(body.label);
         }
      };

      // We attach the double click listener to the container div or canvas
      // containerRef is the wrapper div.
      // But we need to do this in an effect that has access to 'bodiesRef' and 'handlePop'
      // The current effect has them.

      if (containerRef.current) {
         containerRef.current.addEventListener('dblclick', handleDoubleClick);
      }

      return () => {
         // Cleanup existing listeners
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
         Matter.Events.off(mouseC, 'startdrag', undefined as any);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
         Matter.Events.off(mouseC, 'enddrag', undefined as any);

         if (containerRef.current) {
             containerRef.current.removeEventListener('dblclick', handleDoubleClick);
         }
      };

      // Update hover state during drag?
      // We need a separate loop or event for 'mousemove' to check if dragged body is over trash.
      // Matter.Events.on(mouseC, 'mousemove') does not exist.
      // We can use the main loop to check distance if a body is being dragged.
    }

    // (Cleanup code already handled in the previous replace block)
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, tasks]); // Re-bind if tasks change? No, engine is stable.

  // Continuous check for Trash Hover Effect
  useEffect(() => {
     if (!isReady || !engineRef.current || !trashRef.current) return;
     let frameId: number;

     const checkHover = () => {
       const mouseC = mouseConstraintRef.current;

       if (mouseC && mouseC.body) { // mouseC.body is set when dragging
          const { x, y } = mouseC.body.position;
          const trashRect = trashRef.current!.getBoundingClientRect();

          const isOver =
            x >= trashRect.left &&
            x <= trashRect.right &&
            y >= trashRect.top &&
            y <= trashRect.bottom;

          setTrashHovered(isOver);
       } else {
         setTrashHovered(false);
       }
       frameId = requestAnimationFrame(checkHover);
     };

     checkHover();
     return () => cancelAnimationFrame(frameId);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);


  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handlePop = (id: string) => {
    // Play sound?
    // Remove from state
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setBubbleColors(prev => {
        const next = {...prev};
        delete next[id];
        return next;
    });
  };

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-200 overflow-hidden relative touch-none">
      {/* Physics Container (Canvas Wrapper) */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-10"
      />

      {/* DOM Bubbles Layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        <AnimatePresence>
          {tasks.map((task) => (
            <Bubble
              key={task.id}
              ref={(el) => {
                if (el) domRefs.current.set(task.id, el);
                else domRefs.current.delete(task.id);
              }}
              task={task}
              r={calculateRadius(task.text)}
              color={bubbleColors[task.id] || '#ccc'}
            />
          ))}
        </AnimatePresence>
      </div>

      <TrashZone ref={trashRef} isHovered={trashHovered} />
      <InputOverlay onAddTask={handleAddTask} />

      {/* Instructions / Branding */}
      <div className="absolute top-4 left-4 z-0 opacity-50 pointer-events-none">
         <h1 className="text-2xl font-bold text-gray-400">BubbleDo</h1>
         <p className="text-sm text-gray-400">Drag to trash, Double-click to pop</p>
      </div>
    </div>
  );
};
