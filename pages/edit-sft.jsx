import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState, useContext } from 'react';

import { ShowcaseSFT } from '../components/Cards/SFT';
import { ViewEditSFT } from '../components/Cards/DetailView';

import { MetamaskContext } from "../context/MetamaskContext";

import { create as ipfsClient } from 'ipfs-http-client';

const auth =
    'Basic ' + Buffer.from(process.env.NEXT_PUBLIC_PROJECT_ID + ':' + process.env.NEXT_PUBLIC_API_KEY_SECRET).toString('base64');

    const client = ipfsClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    headers: {
        authorization: auth,
    },
});



export default function EditSFT() {

    const { sftContract } = useContext(MetamaskContext);

    const [id, setId] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);
    const [formInput, updateFormInput] = useState({name: '', description: '', type: '', supply:0 })
    const [loading, setLoading] = useState(false);
    
    const router = useRouter();

    useEffect(() => {

        loadSFT();

    }, [])    


    async function loadSFT(){

        const {id, tokenURI,balance} = router.query;
        
        if(id <= 0) return 

        const metadata = await axios.get(tokenURI);

        setFileUrl(metadata.data.image);

        const _id = id.toString();
        console.log(metadata.data.supply);

        setId(_id);

        updateFormInput(prev => {

            return {
                name: metadata.data.name,
                type: metadata.data.type,
                description: metadata.data.description,
                supply: metadata.data.supply
            }


        })

        return true;
    }


    async function changeHandler(e) {

        const file = e.target.files[0];
        setLoading(true);
    
        try{
    
          const added = await client.add(
            file,
            {
              progress: (prog) => console.log(`received: ${prog}`)
            }
          )
          const url = `https://ipfs.io/ipfs/${added.path}`;
    
          setFileUrl(url);
          setLoading(false);
        }
        catch(error){
          setLoading(false);
          console.log(error);
        }
       
      }
    
      async function saveSFT(){
        // saves the SFT on ipfs
    
        let {name, description, type, supply} = formInput;
    
        if(!name || !description || !fileUrl) return alert("Please enter details !");
  
        type = "ERC1155";
  
        const data = JSON.stringify({
          name,description, image: fileUrl,type,supply
        });
    
        try {
    
          const added = await client.add(data);
  
          const url = `https://ipfs.io/ipfs/${added.path}`;
          createSFT(url);
          
        } catch (error) {
            console.log(error);
        }
      }
    
      async function createSFT(url){

    
        try {

            if(!id) return;
        
        let transaction = await sftContract.updateTokenURI(id, url);
  
        let tx = await transaction.wait();
  
        if(tx){
            alert("Success!!!");
        }
          
        } catch (error) {
          
          
          if(error.code === 4001){
            return;
          }

          if(error.error.code === -32603){
                return alert("You've minted this token but you are no longer the owner.");
            }
  
          console.log(error);
        }
      }

    return (
        <><div className='w-full h-full gradient-bg-sec '>
            <div className='flex flex-col h-full w-full p-12 justify-around items-center white-glassmorphism'>
            <div className='flex flex-col gap-24 md:flex-row md:gap-0 w-full my-auto justify-around items-center'>
            
            <div className=''>
            <ViewEditSFT 
            
            name={formInput.name} 
            nameChangeHandler={e => updateFormInput({...formInput, name: e.target.value})}
            
            description={formInput.description} priceHandler={e => setPriceHandler(e)}
            descriptionChangeHandler={e => updateFormInput({...formInput, description: e.target.value})}
            
            changeHandler={changeHandler}

            fileUrl = {fileUrl}
            
            loading={loading} 
            
            editSFTHandler={saveSFT}

            closeHandler={() => router.back()}
            
            /> 
            </div>
            
            <div className=''>
            <ShowcaseSFT id={id} uri={fileUrl} name={formInput.name} balance={formInput.supply} />
            </div>
            </div>
        </div>
        </div>
        </>
    )
}