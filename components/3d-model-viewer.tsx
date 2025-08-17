'use client'

import React, { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useProgress, Html, Environment } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { Mesh, Group, Material } from 'three'
import * as THREE from 'three'
import { Button } from '@/components/ui/button'
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react'

// Color mapping function for sneaker parts
function getColorForMesh(mesh: Mesh, productColors: string[]): number {
  const meshName = mesh.name?.toLowerCase() || ''
  const position = mesh.position
  
  // Color mapping based on common sneaker color schemes
  const colorMap: { [key: string]: number } = {
    'black': 0x1a1a1a,
    'white': 0xf5f5f5,
    'red': 0xdc2626,
    'blue': 0x2563eb,
    'green': 0x16a34a,
    'yellow': 0xeab308,
    'orange': 0xea580c,
    'purple': 0x9333ea,
    'pink': 0xec4899,
    'gray': 0x6b7280,
    'grey': 0x6b7280,
    'brown': 0x92400e,
    'navy': 0x1e3a8a,
    'silver': 0xd1d5db
  }
  
  // If no product colors available, use default scheme
  if (productColors.length === 0) {
    return 0xf5f5f5 // Default white
  }
  
  // Assign colors based on mesh characteristics and position
  const primaryColor = productColors[0]?.toLowerCase() || 'white'
  const secondaryColor = productColors[1]?.toLowerCase() || primaryColor
  const accentColor = productColors[2]?.toLowerCase() || secondaryColor
  
  // Sole (bottom part) - usually white or secondary color
  if (position.y < -0.5 || meshName.includes('sole') || meshName.includes('bottom')) {
    return colorMap[secondaryColor] || colorMap['white'] || 0xf5f5f5
  }
  
  // Laces and small details - accent color
  if (meshName.includes('lace') || meshName.includes('eyelet') || meshName.includes('logo')) {
    return colorMap[accentColor] || colorMap[primaryColor] || 0x1a1a1a
  }
  
  // Upper part of shoe - primary color
  if (position.y > 0 || meshName.includes('upper') || meshName.includes('body')) {
    return colorMap[primaryColor] || 0xf5f5f5
  }
  
  // Default to primary color
  return colorMap[primaryColor] || 0xf5f5f5
}

interface Model3DProps {
  url: string
  productColors?: string[]
}

function Model3D({ url, productColors = [] }: Model3DProps) {
  const meshRef = useRef<Group>(null)
  const [isRotating, setIsRotating] = useState(false)
  const [loadedModel, setLoadedModel] = useState<THREE.Group | null>(null)

  useFrame((state, delta) => {
    if (meshRef.current && isRotating) {
      meshRef.current.rotation.y += delta * 0.5
    }
  })

  // Load model with materials (OBJ + MTL with fallback)
  React.useEffect(() => {
    const loadModel = async () => {
      try {
        console.log('🔄 Starting OBJ+MTL loading:', url)
        // Extract base filename from URL (without .obj extension)
        const objFilename = url.split('/').pop() || ''
        const baseFilename = objFilename.replace('.obj', '')
        
        const objLoader = new OBJLoader()
        let obj: THREE.Group
        
        // Try to find the corresponding MTL file
        // Try multiple patterns to find the MTL file
        const possibleMtlPatterns = [
          `${baseFilename}.mtl`, // Simple pattern
          `${baseFilename}-nike_air_zoom_pegasus_36.mtl`, // Nike shoe pattern with prefix
          `${baseFilename}-model.mtl`, // Generic model pattern
          `${baseFilename}-material.mtl`, // Material pattern
          `nike_air_zoom_pegasus_36.mtl` // Original filename pattern
        ]
        
        // Also try to find MTL files that match the prefix pattern
        // Extract the prefix from the OBJ filename (e.g., "3d-model-1755423231919-lzj3n5dmhs8")
        const prefixMatch = baseFilename.match(/^(3d-model-\d+-[a-z0-9]+)$/)
        if (prefixMatch) {
          const prefix = prefixMatch[1]
          // Add patterns with the extracted prefix
          possibleMtlPatterns.unshift(
            `${prefix}-nike_air_zoom_pegasus_36.mtl`,
            `${prefix}-material.mtl`,
            `${prefix}-model.mtl`
          )
        }
        
        let mtlUrl = ''
        let mtlFound = false
        
        console.log('🔍 All MTL patterns to try:', possibleMtlPatterns)
        
        // Try each pattern to find the MTL file
        for (const pattern of possibleMtlPatterns) {
          try {
            const testUrl = `/uploads/3d-models/${pattern}`
            console.log('🔍 Checking for MTL file:', testUrl)
            const response = await fetch(testUrl, { method: 'HEAD' })
            if (response.ok) {
              mtlUrl = testUrl
              mtlFound = true
              console.log('✅ Found MTL file:', mtlUrl)
              break
            } else {
              console.log('❌ MTL file not found:', testUrl, 'Status:', response.status)
            }
          } catch (e) {
            console.log('❌ MTL file not found:', pattern)
          }
        }
        
        if (mtlFound && mtlUrl) {
          try {
            // Try to load MTL file
            console.log('🔄 Loading MTL file:', mtlUrl)
            const mtlLoader = new MTLLoader()
            // Set the resource path for textures
            mtlLoader.setResourcePath('/uploads/3d-models/')
            
            // Add error handling for MTL loading
            mtlLoader.setMaterialOptions({ side: THREE.DoubleSide })
            
            const materials = await mtlLoader.loadAsync(mtlUrl)
            materials.preload()
            console.log('✅ MTL materials loaded:', materials)
            
            // Load OBJ file with materials
            console.log('🔄 Loading OBJ file with materials:', url)
            objLoader.setMaterials(materials)
            obj = await objLoader.loadAsync(url)
            console.log('✅ OBJ file loaded with materials:', obj)
          } catch (mtlError) {
            console.warn('⚠️ Failed to load MTL materials:', mtlError)
            console.log('🔄 Loading OBJ without materials as fallback')
            
            // Fallback: Load OBJ without materials
            obj = await objLoader.loadAsync(url)
            console.log('✅ OBJ loaded without materials (fallback):', obj)
          }
        } else {
          console.log('⚠️ No MTL file found, loading OBJ only')
          // Fallback to OBJ-only loading
          obj = await objLoader.loadAsync(url)
          console.log('✅ OBJ file loaded without materials:', obj)
        }
        
        // Calculate bounding box to center and scale the model
        const box = new THREE.Box3().setFromObject(obj)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        
        console.log('📏 Model dimensions:', size)
        console.log('📍 Model center:', center)
        
        // Center the model
        obj.position.sub(center)
        
        // Scale the model to fit in view
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 2 / maxDim
        obj.scale.setScalar(scale)
        
        console.log('🔧 Applied scale:', scale)
        
        // Enhance materials for better rendering
        obj.traverse((child) => {
          if (child instanceof Mesh) {
            if (child.material) {
              // Enhance existing material from MTL
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  if (mat instanceof THREE.Material) {
                    mat.side = THREE.DoubleSide
                    // Enhance MTL materials with better lighting
                    if (mat instanceof THREE.MeshLambertMaterial || mat instanceof THREE.MeshPhongMaterial) {
                      mat.shininess = mat.shininess || 30
                    }
                  }
                })
              } else if (child.material instanceof THREE.Material) {
                child.material.side = THREE.DoubleSide
                // Enhance MTL materials with better lighting
                if (child.material instanceof THREE.MeshLambertMaterial || child.material instanceof THREE.MeshPhongMaterial) {
                  child.material.shininess = child.material.shininess || 30
                }
              }
              console.log('🎨 Enhanced MTL material for mesh:', child.name, child.material)
            } else {
              // Apply realistic colored material based on product colors as fallback
              const materialColor = getColorForMesh(child, productColors)
              child.material = new THREE.MeshPhongMaterial({
                color: materialColor,
                shininess: 30,
                side: THREE.DoubleSide,
                transparent: false
              })
              console.log('🎨 Applied fallback colored material to mesh:', materialColor.toString(16))
            }
          }
        })
        
        console.log('✅ Model processed and ready to render')
        setLoadedModel(obj)
        console.log('✅ Model set in state:', obj)
      } catch (error) {
        console.error('❌ Error loading 3D model:', error)
      }
    }
    
    loadModel()
  }, [url])

  console.log('🎨 Rendering Model3D component, loadedModel:', loadedModel)
  
  return (
    <group ref={meshRef}>
      {loadedModel && (
        <>
          {console.log('🎨 Rendering primitive with model:', loadedModel)}
          <primitive object={loadedModel} />
        </>
      )}
      
      {/* Show loading indicator if no model is loaded yet */}
      {!loadedModel && (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshLambertMaterial color="#4CAF50" transparent opacity={0.7} />
        </mesh>
      )}
    </group>
  )
}

function Loader() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
        <div>Loading 3D Model... {progress.toFixed(0)}%</div>
      </div>
    </Html>
  )
}

interface ModelViewer3DProps {
  modelUrl: string
  filename?: string
  className?: string
  productColors?: string[]
}

export default function ModelViewer3D({ modelUrl, filename, className = '', productColors = [] }: ModelViewer3DProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoRotate, setAutoRotate] = useState(false)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const resetCamera = () => {
    // This will be handled by OrbitControls reset
    window.location.reload() // Simple reset for now
  }

  return (
    <>
      {/* Normal view container */}
      {!isFullscreen && (
        <div className={`relative ${className}`}>
          <div className="relative bg-gray-900 rounded-lg overflow-hidden transition-all duration-300 w-full h-96">
            {/* Controls */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                onClick={() => setAutoRotate(!autoRotate)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
                onClick={toggleFullscreen}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Model Info */}
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-black/50 rounded px-3 py-2">
                <p className="text-white text-sm font-medium">
                  {filename || 'Interactive 3D Model'}
                </p>
                <p className="text-gray-300 text-xs">
                  Click and drag to rotate • Scroll to zoom
                </p>
              </div>
            </div>

            {/* 3D Canvas */}
            <Canvas
              camera={{ position: [0, 0, 8], fov: 75 }}
              style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #1e2a4e 100%)' }}
              gl={{ antialias: true, alpha: true }}
            >
              {/* Simple lighting for debugging */}
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              
              <Suspense fallback={<Loader />}>
                  <Model3D url={modelUrl} productColors={productColors} />
                </Suspense>
              
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={autoRotate}
                autoRotateSpeed={2}
                minDistance={1}
                maxDistance={10}
              />
            </Canvas>
          </div>
        </div>
      )}

      {/* Fullscreen view - completely independent */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-gray-900 overflow-hidden">
           {/* Controls */}
           <div className="absolute top-4 right-4 z-10 flex gap-2">
             <Button
               size="sm"
               variant="outline"
               className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
               onClick={() => setAutoRotate(!autoRotate)}
             >
               <RotateCcw className="h-4 w-4" />
             </Button>
             <Button
               size="sm"
               variant="outline"
               className="bg-black/50 border-gray-600 text-white hover:bg-black/70"
               onClick={toggleFullscreen}
             >
               <Minimize2 className="h-4 w-4" />
             </Button>
           </div>

           {/* Close button for fullscreen */}
           <Button
             className="absolute top-4 left-4 z-10 bg-red-600 hover:bg-red-700"
             size="sm"
             onClick={toggleFullscreen}
           >
             Close
           </Button>

           {/* Model Info */}
           <div className="absolute bottom-4 left-4 z-10">
             <div className="bg-black/50 rounded px-3 py-2">
               <p className="text-white text-sm font-medium">
                 {filename || 'Interactive 3D Model'}
               </p>
               <p className="text-gray-300 text-xs">
                 Click and drag to rotate • Scroll to zoom
               </p>
             </div>
           </div>

           {/* 3D Canvas */}
           <Canvas
             camera={{ position: [0, 0, 8], fov: 75 }}
             style={{ background: 'linear-gradient(135deg, #2a2a3e 0%, #1e2a4e 100%)' }}
             gl={{ antialias: true, alpha: true }}
           >
             {/* Simple lighting for debugging */}
             <ambientLight intensity={0.6} />
             <directionalLight position={[10, 10, 5]} intensity={1} />
             
             <Suspense fallback={<Loader />}>
                 <Model3D url={modelUrl} productColors={productColors} />
               </Suspense>
             
             <OrbitControls 
               enablePan={true}
               enableZoom={true}
               enableRotate={true}
               autoRotate={autoRotate}
               autoRotateSpeed={2}
               minDistance={1}
               maxDistance={10}
             />
           </Canvas>
         </div>
       )}
    </>
  )
}