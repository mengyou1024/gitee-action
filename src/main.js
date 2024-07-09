const request = require('request')
const core = require('@actions/core')
const github = require('@actions/github')
const fs = require('fs')

const access_token = core.getInput('accessToken')
const username = core.getInput('username')
const repo = core.getInput('repo')
const release_tag = core.getInput('release_tag')
const release_name = core.getInput('release_name')
const release_body = core.getInput('release_body')
const release_file = core.getInput('release_file')

class GiteeClient {
    constructor(accessToken, owner, repo, api_url = "https://gitee.com/api/v5/repos") {
        this.accessToken = accessToken
        this.owner = owner
        this.repo = repo
        this.api_url = api_url
    }

    uploadAssert(release_id, file) {
        let _api_url = this.api_url
        let _owner = this.owner
        let _repo = this.repo
        let _accessToken = this.accessToken
        return new Promise(function (reject, resolve) {
            request.post({
                url: `${_api_url}/${_owner}/${_repo}/releases/${release_id}/attach_files`,
                json: true,
                headers: {
                    "content-type": "application/json",
                },
                formData: {
                    access_token: _accessToken,
                    file: file
                }
            }, function (err, httpResponse, body) {
                if (err) {
                    reject(err)
                } else {
                    resolve(body)
                }
            })
        })
    }

    async uploadAssertSync(release_id, file) {
        let req_body = await this.uploadAssert(release_id, file)
        return req_body
    }

    createRelease(tag_name, name, body, prerelease = false, target_commitish = "master") {
        let _api_url = this.api_url
        let _owner = this.owner
        let _repo = this.repo
        let _accessToken = this.accessToken
        return new Promise(function (resolve, reject) {
            request.post({
                url: `${_api_url}/${_owner}/${_repo}/releases`,
                json: true,
                headers: {
                    "content-type": "application/json",
                },
                form: {
                    access_token: _accessToken,
                    tag_name: tag_name,
                    name: name,
                    body: body,
                    prerelease: prerelease,
                    target_commitish: target_commitish
                }
            }, function (err, httpResponse, body) {
                if (err) {
                    reject(err)
                } else {
                    resolve(body)
                }
            })
        })
    }

    async createReleaseSync(tag_name, name, body, prerelease = false, target_commitish = "master") {
        let req_body = await this.createRelease(tag_name, name, body, prerelease, target_commitish)
        return req_body
    }

};

const client = new GiteeClient(access_token, username, repo)
client.createReleaseSync(release_tag, release_name, release_body, false, "master").then(body => {
    if (body.id) {
        console.log("rlease created, id:", body.id)
        core.info("release created, id:", body.id)
        client.uploadAssertSync(body.id, fs.createReadStream(release_file)).then(body => {
            console.log(body)
            core.info("upload assert success:", body)
        }).catch(err => {
            console.log(err)
        })
    }
})
